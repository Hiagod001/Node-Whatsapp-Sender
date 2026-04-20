import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import pino from 'pino';
import { fileURLToPath } from 'url';
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestWaWebVersion,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const logger = pino({ level: 'silent' });

const state = {
  status: 'starting',
  qrString: '',
  updatedAt: new Date().toISOString(),
  message: 'Inicializando cliente do WhatsApp...'
};

let sock = null;
let saveCredsRef = null;
let reconnectTimer = null;
let connectInProgress = false;
let batchInProgress = false;
const authFolderPath = path.join(__dirname, 'auth_info');

function updateState(status, qrString = '', message = '') {
  state.status = status;
  state.qrString = qrString;
  state.updatedAt = new Date().toISOString();
  state.message = message;
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let insideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && insideQuotes && nextChar === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }

    if (char === ',' && !insideQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

async function readBatchEntries() {
  const numbersFilePath = path.join(__dirname, 'Planilha', 'numeros.csv');
  const messagesFilePath = path.join(__dirname, 'Planilha', 'mensagens.txt');

  const rawNumbersContent = await fs.readFile(numbersFilePath, 'utf8');
  const rawMessagesContent = await fs.readFile(messagesFilePath, 'utf8');

  const lines = rawNumbersContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const rows = lines.slice(1).map(parseCsvLine);
  const entries = [];

  for (const row of rows) {
    const phone = normalizePhone(row[0] || '');

    if (phone) {
      entries.push({ phone });
    }
  }

  const messages = rawMessagesContent
    .split(/\r?\n---\r?\n/g)
    .map((message) => message.trim())
    .filter(Boolean);

  return { entries, messages };
}

function pickRandomMessage(messages) {
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
}

async function resolveWhatsAppJid(phone) {
  const phoneJid = `${phone}@s.whatsapp.net`;
  const [result] = await sock.onWhatsApp(phoneJid);

  if (!result?.exists || !result?.jid) {
    return null;
  }

  return result.jid;
}

function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleReconnect(message = 'Tentando reconectar o WhatsApp...') {
  if (reconnectTimer) {
    return;
  }

  updateState('reconnecting', '', message);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectWhatsApp().catch((error) => {
      updateState('error', '', `Falha ao reconectar: ${error.message}`);
      scheduleReconnect('Nova tentativa de conexao em alguns segundos...');
    });
  }, 5000);
}

async function connectWhatsApp() {
  if (connectInProgress) {
    return;
  }

  connectInProgress = true;
  clearReconnectTimer();
  updateState('starting', '', 'Inicializando cliente do WhatsApp...');

  try {
    const { state: authState, saveCreds } = await useMultiFileAuthState(
      authFolderPath
    );
    const { version } = await fetchLatestWaWebVersion();

    saveCredsRef = saveCreds;

    sock = makeWASocket({
      auth: authState,
      logger,
      browser: Browsers.windows('Desktop'),
      version,
      printQRInTerminal: false,
      markOnlineOnConnect: false,
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCredsRef);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        updateState('waiting_qr', qr, 'Aguardando leitura do QR code.');
      }

      if (connection === 'open') {
        updateState('connected', '', 'WhatsApp conectado com sucesso.');
        return;
      }

      if (connection === 'connecting') {
        updateState('starting', '', 'Conectando ao WhatsApp...');
        return;
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const errorMessage = lastDisconnect?.error?.message || 'motivo nao informado';
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        if (shouldReconnect) {
          scheduleReconnect(`Conexao perdida. Codigo: ${statusCode || 'desconhecido'}. Detalhe: ${errorMessage}`);
        } else {
          updateState('logged_out', '', 'Sessao desconectada. Gere um novo QR code.');
        }
      }
    });
  } finally {
    connectInProgress = false;
  }
}

async function resetWhatsAppSession() {
  clearReconnectTimer();
  batchInProgress = false;

  if (sock) {
    try {
      await sock.logout();
    } catch (error) {
      try {
        await sock.end(new Error('Sessao reiniciada manualmente'));
      } catch {
        // Ignora erro de encerramento secundario.
      }
    }

    sock = null;
  }

  await fs.rm(authFolderPath, { recursive: true, force: true });
  updateState('starting', '', 'Sessao removida. Gerando um novo QR code...');
  await connectWhatsApp();
}

app.get('/api/whatsapp-status', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.json({
    status: state.status,
    qr_string: state.qrString,
    updated_at: state.updatedAt,
    message: state.message
  });
});

app.post('/api/send-message', async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const message = String(req.body.message || '').trim();

    if (!phone || phone.length < 12) {
      return res.status(400).json({
        status: 'error',
        message: 'Use DDI + DDD + numero. Exemplo: 5511999999999'
      });
    }

    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: 'A mensagem nao pode ficar vazia'
      });
    }

    if (!sock || state.status !== 'connected') {
      return res.status(503).json({
        status: 'error',
        message: 'WhatsApp nao esta conectado no momento'
      });
    }

    const jid = await resolveWhatsAppJid(phone);
    if (!jid) {
      return res.status(404).json({
        status: 'error',
        message: 'Esse numero nao foi encontrado no WhatsApp'
      });
    }

    const response = await sock.sendMessage(jid, { text: message });

    return res.json({
      status: 'success',
      message_id: response?.key?.id || null,
      jid
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: `Erro ao enviar: ${error.message}`
    });
  }
});

app.post('/api/send-batch', async (req, res) => {
  try {
    if (!sock || state.status !== 'connected') {
      return res.status(503).json({
        status: 'error',
        message: 'WhatsApp nao esta conectado no momento'
      });
    }

    if (batchInProgress) {
      return res.status(409).json({
        status: 'error',
        message: 'Ja existe um envio em lote em andamento'
      });
    }

    batchInProgress = true;

    const { entries, messages } = await readBatchEntries();

    if (!entries.length) {
      batchInProgress = false;
        return res.status(400).json({
          status: 'error',
          message: 'Nenhum numero valido foi encontrado em Planilha/numeros.csv'
        });
      }

    if (!messages.length) {
      batchInProgress = false;
      return res.status(400).json({
        status: 'error',
        message: 'Nenhuma mensagem valida foi encontrada em Planilha/mensagens.txt'
      });
    }

    const uniquePhones = [...new Set(entries.map((entry) => entry.phone))];
    const results = [];

    for (const phone of uniquePhones) {
      const randomMessage = pickRandomMessage(messages);

      try {
        const jid = await resolveWhatsAppJid(phone);

        if (!jid) {
          results.push({
            phone,
            status: 'error',
            message: 'Numero nao encontrado no WhatsApp'
          });
          continue;
        }

        const response = await sock.sendMessage(jid, { text: randomMessage });

        results.push({
          phone,
          status: 'success',
          jid,
          sent_message: randomMessage,
          message_id: response?.key?.id || null
        });

        await delay(1500 + Math.floor(Math.random() * 2000));
      } catch (error) {
        results.push({
          phone,
          status: 'error',
          message: error.message
        });
      }
    }

    const successCount = results.filter((item) => item.status === 'success').length;
    const errorCount = results.length - successCount;

    batchInProgress = false;

    return res.json({
      status: 'success',
      message: `Envio em lote finalizado. Sucessos: ${successCount}. Falhas: ${errorCount}.`,
      total_numbers: uniquePhones.length,
      total_messages_available: messages.length,
      success_count: successCount,
      error_count: errorCount,
      results
    });
  } catch (error) {
    batchInProgress = false;
    return res.status(500).json({
      status: 'error',
      message: `Erro no envio em lote: ${error.message}`
    });
  }
});

app.post('/api/reset-connection', async (req, res) => {
  try {
    await resetWhatsAppSession();

    return res.json({
      status: 'success',
      message: 'Sessao desconectada com sucesso. Aguarde o novo QR code.'
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: `Erro ao reiniciar a conexao: ${error.message}`
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Servidor Node rodando em http://localhost:${port}`);
  connectWhatsApp().catch((error) => {
    updateState('error', '', `Erro ao iniciar cliente: ${error.message}`);
    scheduleReconnect('Nova tentativa de conexao em alguns segundos...');
  });
});

# WhatsApp Bot Node

Versao leve em Node.js para conectar o WhatsApp Web, exibir QR code no navegador e enviar mensagens sem Docker.

## Requisitos

- Node.js 20 ou superior

## Instalacao

```bash
npm install
```

## Como iniciar

```bash
npm start
```

Depois abra:

```text
http://localhost:3000
```

## Funcionalidades

- conexao com WhatsApp via QR code
- reconexao automatica
- envio individual pelo painel
- envio em lote pela pasta `Planilha`
- opcao para desconectar a sessao e gerar um novo QR code

## Estrutura da pasta Planilha

Arquivos usados:

- `Planilha/numeros.csv`
- `Planilha/mensagens.txt`

### numeros.csv

```csv
numero
5534999999999
5534988888888
```

### mensagens.txt

Escreva uma mensagem normalmente, preservando as quebras de linha.

Se quiser varias mensagens para sorteio aleatorio, separe cada uma com:

```text
---
```

Exemplo:

```text
Boa tarde!
Mensagem 1

---

Boa tarde!
Mensagem 2
```

## Observacoes

- a pasta `auth_info/` guarda a sessao do WhatsApp e nao deve ser enviada no Git
- `node_modules/` nao vai no Git nem no zip de distribuicao
- para gerar um novo QR code, use o botao no painel para desconectar a sessao atual

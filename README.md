# Node WhatsApp Sender

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-Painel-111111?style=for-the-badge&logo=express&logoColor=white)
![WhatsApp](https://img.shields.io/badge/WhatsApp-Baileys-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)

Aplicação leve em Node.js para conectar uma sessão do WhatsApp Web por QR Code e enviar mensagens individuais ou em lote a partir de arquivos locais.

## Recursos

- Conexão do WhatsApp via QR Code exibido no painel.
- Envio individual informando número e mensagem.
- Envio em lote usando `Planilha/numeros.csv` e `Planilha/mensagens.txt`.
- Sorteio de mensagens quando houver mais de uma opção no arquivo.
- Reinício da sessão para gerar um novo QR Code.
- Interface web simples para operação local.

<details>
<summary><strong>Como funciona o envio em lote</strong></summary>

1. Os números são carregados de `Planilha/numeros.csv`.
2. As mensagens são carregadas de `Planilha/mensagens.txt`.
3. O sistema valida os números, monta o JID do WhatsApp e faz o envio.
4. O painel retorna o total processado e o status da operação.

</details>

## Instalação

```bash
npm install
npm start
```

Acesse:

```text
http://localhost:3000
```

## Arquivos de Entrada

### `Planilha/numeros.csv`

Use um número por linha ou uma coluna simples com telefones. Inclua DDD e evite caracteres desnecessários.

```csv
34999999999
34988888888
```

### `Planilha/mensagens.txt`

Escreva uma ou mais mensagens. Quando houver múltiplas mensagens, o sistema pode sortear uma delas durante o lote.

```text
Olá, tudo bem?
Esta é uma mensagem de exemplo.
```

## Estrutura

```text
.
|-- server.js
|-- public/
|-- Planilha/
|   |-- numeros.csv
|   `-- mensagens.txt
|-- package.json
`-- README.md
```

## Boas Práticas

- Use apenas listas autorizadas.
- Faça um teste com poucos números antes de rodar um lote grande.
- Evite mensagens repetitivas em alta frequência.
- Não versione sessões, listas reais ou dados sensíveis.

# Node WhatsApp Sender

Projeto em Node.js para conectar uma sessao do WhatsApp Web, abrir o QR Code no navegador e fazer envios pelo painel ou em lote.

A ideia aqui foi manter tudo leve e simples de rodar, sem Docker e sem uma estrutura pesada.

## O que ele faz

- conecta o WhatsApp por QR Code
- envia mensagem individual pelo painel
- envia em lote usando uma lista de numeros e um arquivo TXT de mensagens
- permite desconectar a sessao atual e gerar um novo QR Code

## Como rodar

Com Node.js instalado:

```bash
npm install
npm start
```

Depois abra:

```text
http://localhost:3000
```

## Como funciona o lote

O envio em lote usa dois arquivos dentro da pasta `Planilha`:

- `Planilha/numeros.csv`
- `Planilha/mensagens.txt`

### numeros.csv

Deixe nesse formato:

```csv
numero
5534999999999
5534988888888
5531977777777
```

Sempre com DDI + DDD + numero.

### mensagens.txt

Aqui voce escreve a mensagem do jeito que quer que ela seja enviada, com as quebras de linha preservadas.

Exemplo:

```text
Boa tarde!
Voce acabou de ganhar 1 mes de IPTV gratuito!

Para reinvidicar responda com "Quero"

(Condicoes sao aplicadas para resgate da promocao)
```

Se quiser deixar mais de uma mensagem para sorteio aleatorio, separe usando:

```text
---
```

Exemplo:

```text
Mensagem 1

---

Mensagem 2
```

## Estrutura

```text
.
|-- Planilha/
|   |-- COMO_USAR.txt
|   |-- mensagens.txt
|   `-- numeros.csv
|-- public/
|   `-- index.html
|-- package.json
|-- package-lock.json
`-- server.js
```

## Uso no dia a dia

1. Rode o projeto com `npm start`
2. Leia o QR Code no navegador
3. Use o painel para envio individual ou envio em lote
4. Se quiser trocar a conta conectada, use o botao para desconectar e gerar um novo QR Code

## Observacao

Depois que a sessao for conectada uma vez, ela fica salva localmente para nao precisar ler o QR toda hora. Se quiser forcar uma nova conexao, basta usar a opcao de desconectar no painel.

# Node WhatsApp Sender

Aplicacao leve em Node.js para conectar o WhatsApp Web, exibir QR Code no navegador e enviar mensagens de forma manual ou em lote, sem Docker.

## Visao Geral

Este projeto foi pensado para quem quer uma solucao simples de usar no Windows ou em qualquer ambiente com Node.js, sem depender de containers ou de uma stack pesada.

Com ele, voce consegue:

- conectar uma sessao do WhatsApp por QR Code
- enviar mensagens individualmente pelo painel
- enviar mensagens em lote a partir de arquivos locais
- desconectar a sessao atual e gerar um novo QR Code
- manter uma estrutura simples para compartilhar, versionar ou adaptar

## Tecnologias

- Node.js
- Express
- Baileys
- HTML + JavaScript no painel web

## Requisitos

- Node.js 20 ou superior

## Instalacao

```bash
npm install
```

## Como Executar

```bash
npm start
```

Depois disso, abra no navegador:

```text
http://localhost:3000
```

## Funcionalidades

- Conexao via QR Code diretamente no painel
- Reconexao automatica da sessao
- Envio individual de mensagens
- Envio em lote usando planilha de numeros
- Leitura de mensagens formatadas em arquivo TXT
- Sorteio aleatorio entre varias mensagens, quando houver mais de uma no TXT
- Botao para desconectar o WhatsApp e gerar um novo QR Code

## Estrutura do Projeto

```text
.
|-- Planilha/
|   |-- COMO_USAR.txt
|   |-- mensagens.txt
|   `-- numeros.csv
|-- public/
|   `-- index.html
|-- .gitignore
|-- package-lock.json
|-- package.json
|-- README.md
`-- server.js
```

## Como Funciona o Envio em Lote

O sistema usa dois arquivos dentro da pasta `Planilha/`:

- `Planilha/numeros.csv`
- `Planilha/mensagens.txt`

### Arquivo de Numeros

O arquivo `numeros.csv` deve conter apenas a coluna `numero`:

```csv
numero
5534999999999
5534988888888
5531977777777
```

Regras:

- use DDI + DDD + numero
- uma linha equivale a um destinatario
- numeros duplicados sao tratados como um unico envio por execucao

### Arquivo de Mensagens

O arquivo `mensagens.txt` preserva a formatacao original, incluindo quebras de linha.

Exemplo com uma unica mensagem:

```text
Boa tarde!
Voce acabou de ganhar 1 mes de IPTV gratuito!

Para reinvidicar responda com "Quero"

(Condicoes sao aplicadas para resgate da promocao)
```

Exemplo com varias mensagens para sorteio aleatorio:

```text
Mensagem A

---

Mensagem B

---

Mensagem C
```

Quando houver mais de uma mensagem no arquivo, o sistema escolhe uma aleatoriamente para cada numero do lote.

## Fluxo de Uso

1. Inicie a aplicacao com `npm start`
2. Acesse `http://localhost:3000`
3. Leia o QR Code com o WhatsApp
4. Escolha entre:
   - envio individual pelo painel
   - envio em lote pelos arquivos da pasta `Planilha`
5. Se precisar trocar de conta, use a opcao de desconectar para gerar um novo QR Code

## Sessao do WhatsApp

A sessao autenticada fica salva localmente na pasta:

```text
auth_info/
```

Isso evita a necessidade de ler o QR Code toda vez.

Se quiser forcar uma nova conexao:

- use o botao de desconectar no painel
- ou apague a pasta `auth_info/`

## Arquivos que Nao Devem Ir para o Git

Estes itens sao locais e nao devem ser publicados:

- `node_modules/`
- `auth_info/`
- logs temporarios

## Observacoes

- o projeto foi estruturado para ser simples de adaptar
- o painel funciona localmente, sem Docker
- a pasta `Planilha/` pode ser trocada por outro fluxo de importacao no futuro

## Licenca

Defina a licenca que preferir antes de publicar em producao ou compartilhar comercialmente.

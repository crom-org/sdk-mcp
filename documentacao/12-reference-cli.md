# 12 — Referência do CLI `sdk-mcp`

O `sdk-mcp` inclui um CLI para scaffolding e para rodar o servidor exemplo.

## Instalar e buildar

```bash
cd /caminho/para/sdk-mcp
npm install
npm run build
```

## Comandos

### `sdk-mcp langs`

Lista todas as linguagens suportadas para scaffolding.

```bash
node dist/bin.js langs
# Saída: Linguagens suportadas: python, go, php, rust
```

### `sdk-mcp init <linguagem> <pasta> <nome-projeto>`

Gera um MCP pronto em uma linguagem específica.

```bash
# Python
node dist/bin.js init python ./meu-mcp-python meu-mcp-python

# Go
node dist/bin.js init go ./meu-mcp-go meu-mcp-go

# PHP
node dist/bin.js init php ./meu-mcp-php meu-mcp-php

# Rust
node dist/bin.js init rust ./meu-mcp-rust meu-mcp-rust
```

Após gerar, siga as instruções impressas (instalar e rodar).

### `sdk-mcp server`

Inicia o servidor exemplo MCP (MCP de MCPs) via stdio.

```bash
node dist/bin.js server
# ou
npm start
```

Este servidor expõe as tools `crom_*` e recursos `crom://*`.

## Variáveis de ambiente

Não há variáveis obrigatórias. O servidor exemplo lê `.crom-mcp.yml` da pasta informada via `crom_load_project`.

## Saída do servidor

Todos os servidores MCP do `sdk-mcp` escrevem em **stdout** usando o protocolo JSON-RPC 2.0. Mensagens de debug devem ir para **stderr**.

## Exemplos de uso combinado

```bash
# 1. Criar um MCP em Python
node dist/bin.js init python ./meu-mcp-python meu-mcp-python

# 2. Rodar o servidor exemplo do sdk-mcp (controlador)
npm start &

# 3. Conectar um cliente (Claude Code, Cursor, Continue) aos dois servidores acima
```

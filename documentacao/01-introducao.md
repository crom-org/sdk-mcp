# Documentação do sdk-mcp

Bem-vindo ao **sdk-mcp** — o SDK para construir qualquer tipo de servidor MCP (Model Context Protocol) em qualquer linguagem, de qualquer forma que precisar.

Este guia ensina do zero:

- O que é um MCP e como o protocolo funciona
- Como criar um MCP em Node.js, Python, Go, PHP e Rust
- Como incorporar projetos existentes (vídeo, automação, agentes, harnesses)
- Como conectar clientes (Claude Code, Cursor, Continue, etc.)
- Como usar regras por pasta de projeto (`.crom-mcp.yml`)

## Índice da documentação

| Arquivo | Conteúdo |
|---------|----------|
| `02-conceitos-basicos.md` | O que é MCP, JSON-RPC, stdio, servidor vs cliente |
| `03-criando-mcp-node.md` | Criar MCP em Node.js / TypeScript |
| `04-criando-mcp-python.md` | Criar MCP em Python (stdlib) |
| `05-criando-mcp-go.md` | Criar MCP em Go |
| `06-criando-mcp-php.md` | Criar MCP em PHP |
| `07-criando-mcp-rust.md` | Criar MCP em Rust |
| `08-incorporando-projetos-existentes.md` | Adaptar projetos já prontos para MCP |
| `09-cliente-mcp-conectando.md` | Conectar clientes (Claude Code, Cursor, etc.) |
| `10-regras-config-projeto.md` | `.crom-mcp.yml`, regras e configuração por pasta |
| `11-exemplos-praticos.md` | Exemplos prontos para copiar e usar |
| `12-reference-cli.md` | Referência completa do CLI `sdk-mcp` |

## Comece aqui

Se você nunca criou um MCP, leia [`02-conceitos-basicos.md`](./02-conceitos-basicos.md).  
Se já sabe o que quer, vá direto para a linguagem de sua escolha.

## Filosofia do sdk-mcp

O protocolo MCP é simples: **JSON-RPC 2.0 sobre stdio** (ou HTTP/SSE).  
Qualquer linguagem que consiga:
1. Ler de stdin
2. Escrever em stdout
3. Fazer parse de JSON

…pode ser um MCP. Não existe "o SDK oficial para todas as linguagens" — este projeto fornece templates e classes para você construir o seu, da forma que precisar.

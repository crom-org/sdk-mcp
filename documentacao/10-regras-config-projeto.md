# 10 — Regras e Configuração por Pasta de Projeto (`.crom-mcp.yml`)

Uma das funcionalidades centrais do `sdk-mcp` é a configuração baseada em pasta de projeto. Quando você entra em uma pasta que contém `.crom-mcp.yml` (ou `.yaml`/`.json`), o SDK:

1. Carrega as **regras** que devem ser relembradas antes de usar qualquer MCP daquele projeto
2. Registra os **MCPs** que o projeto pode conectar
3. Registra os **harnesses**, **scripts** e **agentes** disponíveis

## Estrutura do arquivo

```yaml
name: meu-projeto
description: Descrição do projeto
rootPath: ./

# Regras relembradas antes de começar a usar o MCP
rules:
  - id: regra-1
    type: instruction   # system | instruction | constraint | context | example
    title: Título da regra
    content: Conteúdo da regra que será injetado no contexto
    priority: 10        # maior = mais importante, exibido primeiro
    enabled: true
    appliesTo: []       # lista de ferramentas ou padrões glob aos quais se aplica

# MCPs que este projeto pode conectar
mcps:
  - id: mcp-local
    name: Meu MCP Local
    type: stdio         # stdio | http | sse
    command: npx
    args: ["@modelcontextprotocol/some-server"]
    url: null           # usado se type for http/sse
    env:
      CHAVE: valor
    enabled: true
    autoConnect: false  # se true, conecta automaticamente ao carregar o projeto

# Harnesses que podem ser executados
harnesses:
  - id: harness-build
    name: Build do Projeto
    type: command       # command | script | http | mcp
    command: npm
    args: ["run", "build"]
    scriptPath: null    # usado se type for script
    url: null           # usado se type for http
    mcpId: null         # usado se type for mcp
    env: {}
    timeoutMs: 300000
    retryCount: 2
    enabled: true

# Scripts disponíveis
scripts:
  - id: script-dev
    name: Script de Dev
    path: ./scripts/dev.js
    interpreter: node
    args: []
    env: {}
    timeoutMs: 30000
    enabled: true

# Agentes vinculados
agents:
  - id: agent-coder
    name: Agent Coder
    type: local         # mcp | local | remote
    mcpId: null         # se type for mcp
    systemPrompt: Você é um assistente de código.
    tools: []
    config: {}
    enabled: true
```

## Formatos suportados

| Extensão | Formato |
|----------|---------|
| `.crom-mcp.yml` | YAML |
| `.crom-mcp.yaml` | YAML |
| `.crom-mcp.json` | JSON |
| `crom-mcp.yml` | YAML (sem ponto inicial) |
| `crom-mcp.yaml` | YAML (sem ponto inicial) |
| `crom-mcp.json` | JSON (sem ponto inicial) |

## Criar um arquivo de configuração inicial

Via CLI:

```bash
node dist/bin.js crom-create-project-config --projectPath ./meu-projeto --projectName "Meu Projeto"
```

Ou via tool MCP:

```json
{
  "name": "crom_create_project_config",
  "arguments": {
    "projectPath": "./meu-projeto",
    "projectName": "Meu Projeto"
  }
}
```

## Carregar um projeto

Via CLI:

```bash
# O servidor exemplo do sdk-mcp lê o projeto quando você usa crom_load_project
```

Via tool MCP:

```json
{
  "name": "crom_load_project",
  "arguments": {
    "projectPath": "./meu-projeto"
  }
}
```

## Obter as regras do projeto

Via tool MCP:

```json
{
  "name": "crom_get_rules",
  "arguments": {}
}
```

Ou acesse o recurso:

```
crom://project/rules
```

## Como as regras são usadas

Quando um cliente carrega um projeto com `crom_load_project`, o servidor:
1. Lê o `.crom-mcp.yml`
2. Ordena as regras por prioridade (maior primeiro)
3. As expõe via `crom_get_rules` e via recurso `crom://project/rules`
4. O agente/LLM deve ler essas regras **antes** de executar qualquer ação no projeto

## Exemplo completo (editor de vídeo)

Veja [`08-incorporando-projetos-existentes.md`](./08-incorporando-projetos-existentes.md) para um exemplo prático com editor de vídeo, pasta de criações, ffmpeg e regras.

## Buscar projetos crom-mcp em uma pasta

Via tool MCP:

```json
{
  "name": "crom_list_projects",
  "arguments": {
    "searchPath": "./",
    "maxDepth": 3
  }
}
```

Isso procura recursivamente por arquivos `.crom-mcp.*` e lista os projetos encontrados.

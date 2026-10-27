# 08 — Incorporando Projetos Existentes

Você pode transformar qualquer projeto já existente (editor de vídeo, automação, script, agente, harness) em um MCP. Não precisa reescrever tudo — apenas envolva o que já existe com o `sdk-mcp`.

## Estratégia geral

1. **Identifique o que expor**: quais comandos, scripts, APIs ou funções do projeto devem virar ferramentas MCP?
2. **Crie um MCP wrapper**: um servidor MCP pequeno que chama o projeto existente.
3. **Configure regras por pasta**: crie `.crom-mcp.yml` na raiz do projeto para definir regras e MCPs relacionados.
4. **Conecte ao cliente**: aponte o cliente MCP para o wrapper.

## Exemplo A: Projeto de editor de vídeo (pasta de criações)

Suponha que você tem uma pasta `/projetos/editor-video/` com scripts de edição.

### 1. Criar `.crom-mcp.yml`

```yaml
name: editor-video
description: Editor de vídeo com pasta de criações
rootPath: ./projetos/editor-video

rules:
  - id: regra-criacoes
    type: instruction
    title: Pasta de criações
    content: Sempre trabalhe dentro da pasta ./criacoes. Não apague arquivos sem confirmação.
    priority: 10
    enabled: true

mcps:
  - id: mcp-filesystem
    name: Filesystem
    type: stdio
    command: npx
    args: ["@modelcontextprotocol/server-filesystem", "./criacoes"]
    enabled: true
    autoConnect: true

harnesses:
  - id: harness-render
    name: Renderizar Vídeo
    type: command
    command: ffmpeg
    args: ["-i", "./criacoes/entrada.mp4", "./criacoes/saida.mp4"]
    timeoutMs: 600000
    retryCount: 1
    enabled: true

scripts:
  - id: script-cortar
    name: Cortar Vídeo
    path: ./scripts/cortar.js
    interpreter: node
    enabled: true

agents:
  - id: agent-editor
    name: Agent Editor
    type: local
    systemPrompt: Você edita vídeos na pasta de criações usando ferramentas MCP.
    enabled: true
```

### 2. Criar o MCP wrapper (Node)

```typescript
// wrapper/index.ts
import { MCPServer, StdioTransport } from "sdk-mcp";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const server = new MCPServer({
  name: "editor-video-mcp",
  version: "1.0.0",
  instructions: "Controle do editor de vídeo na pasta de criações",
});

const CRIACOES = path.resolve("./criacoes");

// Tool: listar criações
server.registerTool(
  "listar-criacoes",
  "Lista arquivos na pasta de criações",
  {
    type: "object",
    properties: {},
    required: [],
  },
  async () => {
    const arquivos = fs.readdirSync(CRIACOES);
    return {
      content: [{ type: "text", text: arquivos.join("\n") }],
    };
  }
);

// Tool: renderizar vídeo (chama ffmpeg)
server.registerTool(
  "renderizar-video",
  "Renderiza um vídeo usando ffmpeg",
  {
    type: "object",
    properties: {
      entrada: { type: "string", description: "Arquivo de entrada na pasta de criações" },
      saida: { type: "string", description: "Nome do arquivo de saída" },
    },
    required: ["entrada", "saida"],
  },
  async ({ entrada, saida }: { entrada: string; saida: string }) => {
    try {
      const cmd = `ffmpeg -i "${path.join(CRIACOES, entrada)}" "${path.join(CRIACOES, saida)}"`;
      execSync(cmd, { stdio: "pipe" });
      return { content: [{ type: "text", text: "Renderizado com sucesso: " + saida }] };
    } catch (err: any) {
      return {
        content: [{ type: "text", text: `Erro ao renderizar: ${err.message}` }],
        isError: true,
      };
    }
  }
);

const transport = new StdioTransport(server);
transport.start();
```

### 3. Rodar e conectar

```bash
# No wrapper
npm run build
node dist/index.js
```

No cliente:

```json
{
  "mcpServers": {
    "editor-video": {
      "command": "node",
      "args": ["/caminho/para/editor-video/wrapper/dist/index.js"]
    }
  }
}
```

## Exemplo B: Script existente (Python, Bash, etc.)

Se você já tem um script `./scripts/backup.sh`, crie um MCP que o chama:

```typescript
server.registerTool(
  "executar-backup",
  "Executa o script de backup existente",
  {
    type: "object",
    properties: {},
    required: [],
  },
  async () => {
    const { execSync } = require("child_process");
    const output = execSync("./scripts/backup.sh", { encoding: "utf-8" });
    return { content: [{ type: "text", text: output }] };
  }
);
```

## Exemplo C: Agente existente

Se você tem um agente em Python ou outro lugar, crie um MCP que o invoca via HTTP ou stdio:

```typescript
server.registerTool(
  "perguntar-ao-agente",
  "Envia uma pergunta ao agente existente",
  {
    type: "object",
    properties: {
      pergunta: { type: "string" },
    },
    required: ["pergunta"],
  },
  async ({ pergunta }: { pergunta: string }) => {
    // Chama o agente existente (HTTP, subprocess, etc.)
    const resposta = await chamarAgenteExistente(pergunta);
    return { content: [{ type: "text", text: resposta }] };
  }
);
```

## Exemplo D: Harness existente

Se você já tem um harness (teste, build, deploy), registre como tool ou use o sistema de harnesses do `sdk-mcp`:

```typescript
// Como tool direta
server.registerTool(
  "rodar-harness-deploy",
  "Executa o harness de deploy existente",
  {},
  async () => {
    const output = execSync("./harness/deploy.sh", { encoding: "utf-8", timeout: 300000 });
    return { content: [{ type: "text", text: output }] };
  }
);
```

Ou pelo sistema de harnesses (veja `10-regras-config-projeto.md`).

## Checklist para incorporar um projeto existente

- [ ] Identificar a pasta raiz do projeto
- [ ] Criar `.crom-mcp.yml` com regras e harnesses
- [ ] Criar wrapper MCP (Node, Python, Go, etc.) que chama o projeto
- [ ] Expor as principais ações como `tools`
- [ ] Testar com `sdk-mcp server` ou com o wrapper diretamente
- [ ] Conectar ao cliente MCP desejado

## Comandos úteis no terminal

```bash
# Ver se o projeto tem config crom-mcp
ls -la .crom-mcp.yml .crom-mcp.yaml .crom-mcp.json

# Criar config inicial
node dist/bin.js init node ./wrapper meu-wrapper

# Rodar o servidor exemplo do sdk-mcp (carrega projetos)
npm start

# Testar uma tool diretamente via cliente MCP
# (use Claude Code, Cursor, ou qualquer cliente MCP)
```

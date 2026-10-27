"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.listLanguages = listLanguages;
exports.getTemplate = getTemplate;
exports.scaffold = scaffold;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const LANG_TEMPLATES = new Map();
function registerTemplate(lang, files, install, run) {
    LANG_TEMPLATES.set(lang, { files, install, run });
}
// ============ PYTHON (stdlib, zero deps) ============
registerTemplate("python", {
    "mcp_server.py": `# MCP Server em Python (stdlib, zero dependências)
# Execute: python mcp_server.py

import json
import sys
from typing import Any, Callable, Dict, Optional

PROTOCOL_VERSION = "2024-11-05"

class MCPServer:
    def __init__(self, name: str, version: str, instructions: Optional[str] = None):
        self.name = name
        self.version = version
        self.instructions = instructions
        self.tools: Dict[str, dict] = {}
        self.resources: Dict[str, dict] = {}
        self.prompts: Dict[str, dict] = {}
        self.initialized = False

    def register_tool(self, name: str, description: str, input_schema: dict, handler: Callable):
        self.tools[name] = {
            "name": name,
            "description": description,
            "inputSchema": input_schema,
            "handler": handler,
        }

    def register_resource(self, uri: str, name: str, mime_type: Optional[str], handler: Callable):
        self.resources[uri] = {
            "uri": uri,
            "name": name,
            "mimeType": mime_type,
            "handler": handler,
        }

    def register_prompt(self, name: str, description: str, handler: Callable):
        self.prompts[name] = {
            "name": name,
            "description": description,
            "handler": handler,
        }

    def handle(self, req: dict) -> dict:
        method = req.get("method")
        rid = req.get("id")
        params = req.get("params") or {}

        try:
            if method == "initialize":
                self.initialized = True
                return {
                    "jsonrpc": "2.0",
                    "id": rid,
                    "result": {
                        "protocolVersion": PROTOCOL_VERSION,
                        "capabilities": {
                            "tools": {},
                            "resources": {},
                            "prompts": {},
                        },
                        "serverInfo": {"name": self.name, "version": self.version},
                        **({"instructions": self.instructions} if self.instructions else {}),
                    },
                }

            if method == "initialized":
                self.initialized = True
                return {"jsonrpc": "2.0", "method": "ack"}

            if method == "ping":
                return {"jsonrpc": "2.0", "id": rid, "result": {}}

            if method == "tools/list":
                return {
                    "jsonrpc": "2.0",
                    "id": rid,
                    "result": {
                        "tools": [
                            {k: v for k, v in t.items() if k != "handler"}
                            for t in self.tools.values()
                        ],
                    },
                }

            if method == "tools/call":
                t = self.tools.get(params.get("name"))
                if not t:
                    return self._error(rid, -32001, f"Tool not found: {params.get('name')}")
                result = t["handler"](params.get("arguments") or {})
                return {"jsonrpc": "2.0", "id": rid, "result": result}

            if method == "resources/list":
                return {
                    "jsonrpc": "2.0",
                    "id": rid,
                    "result": {
                        "resources": [
                            {k: v for k, v in r.items() if k != "handler"}
                            for r in self.resources.values()
                        ],
                    },
                }

            if method == "resources/read":
                uri = params.get("uri")
                r = self.resources.get(uri)
                if not r:
                    return self._error(rid, -32002, f"Resource not found: {uri}")
                result = r["handler"](uri)
                return {"jsonrpc": "2.0", "id": rid, "result": result}

            if method == "prompts/list":
                return {
                    "jsonrpc": "2.0",
                    "id": rid,
                    "result": {
                        "prompts": [
                            {k: v for k, v in p.items() if k != "handler"}
                            for p in self.prompts.values()
                        ],
                    },
                }

            if method == "prompts/get":
                p = self.prompts.get(params.get("name"))
                if not p:
                    return self._error(rid, -32003, f"Prompt not found: {params.get('name')}")
                result = p["handler"](params.get("arguments"))
                return {"jsonrpc": "2.0", "id": rid, "result": result}

            return self._error(rid, -32601, f"Method not found: {method}")
        except Exception as e:
            return self._error(rid, -32603, str(e))

    def _error(self, rid: Any, code: int, message: str) -> dict:
        return {"jsonrpc": "2.0", "id": rid, "error": {"code": code, "message": message}}

    def notify(self, method: str, params: Optional[dict] = None) -> str:
        msg = {"jsonrpc": "2.0", "method": method}
        if params:
            msg["params"] = params
        return json.dumps(msg)

    def log(self, level: str, message: str, data: Any = None) -> str:
        return self.notify("notifications/message", {"level": level, "message": message, "data": data})

def run_stdio(server: MCPServer):
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError:
            sys.stdout.write(json.dumps({"jsonrpc": "2.0", "id": "0", "error": {"code": -32700, "message": "Parse error"}}) + "\\n")
            sys.stdout.flush()
            continue

        resp = server.handle(req)
        if resp.get("method") == "ack":
            continue
        sys.stdout.write(json.dumps(resp) + "\\n")
        sys.stdout.flush()

if __name__ == "__main__":
    server = MCPServer(name="meu-mcp-python", version="1.0.0")

    @server.register_tool  # placeholder, use server.register_tool(...) below
    def exemplo(nome: str) -> dict:
        return {"content": [{"type": "text", "text": f"Olá, {nome}!"}]}

    server.register_tool(
        "exemplo",
        "Um exemplo de ferramenta",
        {"type": "object", "properties": {"nome": {"type": "string"}}, "required": ["nome"]},
        exemplo,
    )

    run_stdio(server)
`,
    "requirements.txt": "# Nenhuma dependência externa necessária (stdlib apenas)\n",
    "README.md": "# MCP Python\nExecute com: python mcp_server.py\n",
}, undefined, "python mcp_server.py");
// ============ GO ============
registerTemplate("go", {
    "go.mod": `module meu-mcp-go

go 1.22
`,
    "main.go": `package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

const protocolVersion = "2024-11-05"

type JSONRPCRequest struct {
	JSONRPC string                 ` + "`" + `json:"jsonrpc"` + "`" + `
	ID      interface{}            ` + "`" + `json:"id"` + "`" + `
	Method  string                 ` + "`" + `json:"method"` + "`" + `
	Params  map[string]interface{} ` + "`" + `json:"params,omitempty"` + "`" + `
}

type JSONRPCResponse struct {
	JSONRPC string      ` + "`" + `json:"jsonrpc"` + "`" + `
	ID      interface{} ` + "`" + `json:"id"` + "`" + `
	Result  interface{} ` + "`" + `json:"result,omitempty"` + "`" + `
	Error   *RPCError   ` + "`" + `json:"error,omitempty"` + "`" + `
}

type RPCError struct {
	Code    int         ` + "`" + `json:"code"` + "`" + `
	Message string      ` + "`" + `json:"message"` + "`" + `
	Data    interface{} ` + "`" + `json:"data,omitempty"` + "`" + `
}

type MCPServer struct {
	Name       string
	Version    string
	Instructions string
	Tools      map[string]interface{}
	Resources  map[string]interface{}
	Prompts    map[string]interface{}
	Initialized bool
}

func NewMCPServer(name, version, instructions string) *MCPServer {
	return &MCPServer{
		Name:         name,
		Version:      version,
		Instructions: instructions,
		Tools:        make(map[string]interface{}),
		Resources:    make(map[string]interface{}),
		Prompts:      make(map[string]interface{}),
	}
}

func (s *MCPServer) handle(req JSONRPCRequest) interface{} {
	switch req.Method {
	case "initialize":
		s.Initialized = true
		caps := map[string]interface{}{
			"tools":      map[string]interface{}{},
			"resources":  map[string]interface{}{},
			"prompts":    map[string]interface{}{},
		}
		info := map[string]interface{}{
			"name":    s.Name,
			"version": s.Version,
		}
		result := map[string]interface{}{
			"protocolVersion": protocolVersion,
			"capabilities":    caps,
			"serverInfo":      info,
		}
		if s.Instructions != "" {
			result["instructions"] = s.Instructions
		}
		return JSONRPCResponse{JSONRPC: "2.0", ID: req.ID, Result: result}

	case "initialized":
		s.Initialized = true
		return map[string]string{"jsonrpc": "2.0", "method": "ack"}

	case "ping":
		return JSONRPCResponse{JSONRPC: "2.0", ID: req.ID, Result: map[string]interface{}{}}

	case "tools/list":
		tools := []interface{}{}
		for _, t := range s.Tools {
			tools = append(tools, t)
		}
		return JSONRPCResponse{JSONRPC: "2.0", ID: req.ID, Result: map[string]interface{}{"tools": tools}}

	case "tools/call":
		name := req.Params["name"].(string)
		if _, ok := s.Tools[name]; !ok {
			return JSONRPCResponse{JSONRPC: "2.0", ID: req.ID, Error: &RPCError{Code: -32001, Message: "Tool not found: " + name}}
		}
		// handler seria invocado aqui; retornando exemplo
		return JSONRPCResponse{JSONRPC: "2.0", ID: req.ID, Result: map[string]interface{}{
			"content": []interface{}{map[string]interface{}{"type": "text", "text": "OK"}},
		}}

	default:
		return JSONRPCResponse{JSONRPC: "2.0", ID: req.ID, Error: &RPCError{Code: -32601, Message: "Method not found: " + req.Method}}
	}
}

func writeJSON(v interface{}) {
	b, _ := json.Marshal(v)
	fmt.Println(string(b))
}

func main() {
	server := NewMCPServer("meu-mcp-go", "1.0.0", "")
	scanner := bufio.NewScanner(os.Stdin)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		var req JSONRPCRequest
		if err := json.Unmarshal([]byte(line), &req); err != nil {
			writeJSON(JSONRPCResponse{JSONRPC: "2.0", ID: "0", Error: &RPCError{Code: -32700, Message: "Parse error"}})
			continue
		}
		resp := server.handle(req)
		if m, ok := resp.(map[string]string); ok && m["method"] == "ack" {
			continue
		}
		writeJSON(resp)
	}
}
`,
    "README.md": "# MCP Go\nExecute com: go run main.go\n",
}, "go mod tidy", "go run main.go");
// ============ PHP ============
registerTemplate("php", {
    "mcp_server.php": `<?php
// MCP Server em PHP (stdlib, zero dependências)
// Execute: php mcp_server.php

define('MCP_PROTOCOL_VERSION', '2024-11-05');

class MCPServer {
    public string $name;
    public string $version;
    public ?string $instructions;
    public array $tools = [];
    public array $resources = [];
    public array $prompts = [];
    public bool $initialized = false;

    public function __construct(string $name, string $version, ?string $instructions = null) {
        $this->name = $name;
        $this->version = $version;
        $this->instructions = $instructions;
    }

    public function registerTool(string $name, string $description, array $inputSchema, callable $handler): void {
        $this->tools[$name] = [
            'name' => $name,
            'description' => $description,
            'inputSchema' => $inputSchema,
            'handler' => $handler,
        ];
    }

    public function registerResource(string $uri, string $name, ?string $mimeType, callable $handler): void {
        $this->resources[$uri] = [
            'uri' => $uri,
            'name' => $name,
            'mimeType' => $mimeType,
            'handler' => $handler,
        ];
    }

    public function registerPrompt(string $name, string $description, callable $handler): void {
        $this->prompts[$name] = [
            'name' => $name,
            'description' => $description,
            'handler' => $handler,
        ];
    }

    public function handle(array $req): array {
        $method = $req['method'] ?? '';
        $id = $req['id'] ?? null;
        $params = $req['params'] ?? [];

        try {
            if ($method === 'initialize') {
                $this->initialized = true;
                $result = [
                    'protocolVersion' => MCP_PROTOCOL_VERSION,
                    'capabilities' => ['tools' => [], 'resources' => [], 'prompts' => []],
                    'serverInfo' => ['name' => $this->name, 'version' => $this->version],
                ];
                if ($this->instructions) {
                    $result['instructions'] = $this->instructions;
                }
                return ['jsonrpc' => '2.0', 'id' => $id, 'result' => $result];
            }

            if ($method === 'initialized') {
                $this->initialized = true;
                return ['jsonrpc' => '2.0', 'method' => 'ack'];
            }

            if ($method === 'ping') {
                return ['jsonrpc' => '2.0', 'id' => $id, 'result' => []];
            }

            if ($method === 'tools/list') {
                $tools = [];
                foreach ($this->tools as $t) {
                    unset($t['handler']);
                    $tools[] = $t;
                }
                return ['jsonrpc' => '2.0', 'id' => $id, 'result' => ['tools' => $tools]];
            }

            if ($method === 'tools/call') {
                $toolName = $params['name'] ?? '';
                if (!isset($this->tools[$toolName])) {
                    return $this->error($id, -32001, "Tool not found: $toolName");
                }
                $result = ($this->tools[$toolName]['handler'])($params['arguments'] ?? []);
                return ['jsonrpc' => '2.0', 'id' => $id, 'result' => $result];
            }

            if ($method === 'resources/list') {
                $resources = [];
                foreach ($this->resources as $r) {
                    unset($r['handler']);
                    $resources[] = $r;
                }
                return ['jsonrpc' => '2.0', 'id' => $id, 'result' => ['resources' => $resources]];
            }

            if ($method === 'resources/read') {
                $uri = $params['uri'] ?? '';
                if (!isset($this->resources[$uri])) {
                    return $this->error($id, -32002, "Resource not found: $uri");
                }
                $result = ($this->resources[$uri]['handler'])($uri);
                return ['jsonrpc' => '2.0', 'id' => $id, 'result' => $result];
            }

            if ($method === 'prompts/list') {
                $prompts = [];
                foreach ($this->prompts as $p) {
                    unset($p['handler']);
                    $prompts[] = $p;
                }
                return ['jsonrpc' => '2.0', 'id' => $id, 'result' => ['prompts' => $prompts]];
            }

            if ($method === 'prompts/get') {
                $name = $params['name'] ?? '';
                if (!isset($this->prompts[$name])) {
                    return $this->error($id, -32003, "Prompt not found: $name");
                }
                $result = ($this->prompts[$name]['handler'])($params['arguments'] ?? null);
                return ['jsonrpc' => '2.0', 'id' => $id, 'result' => $result];
            }

            return $this->error($id, -32601, "Method not found: $method");
        } catch (Throwable $e) {
            return $this->error($id, -32603, $e->getMessage());
        }
    }

    private function error($id, int $code, string $message): array {
        return ['jsonrpc' => '2.0', 'id' => $id, 'error' => ['code' => $code, 'message' => $message]];
    }

    public function notify(string $method, ?array $params = null): string {
        $msg = ['jsonrpc' => '2.0', 'method' => $method];
        if ($params) {
            $msg['params'] = $params;
        }
        return json_encode($msg);
    }

    public function log(string $level, string $message, $data = null): string {
        return $this->notify('notifications/message', ['level' => $level, 'message' => $message, 'data' => $data]);
    }
}

function runStdio(MCPServer $server): void {
    $stdin = fopen('php://stdin', 'r');
    $stdout = fopen('php://stdout', 'w');

    while (!feof($stdin)) {
        $line = fgets($stdin);
        if ($line === false) {
            break;
        }
        $line = trim($line);
        if ($line === '') {
            continue;
        }
        $req = json_decode($line, true);
        if ($req === null) {
            fwrite($stdout, json_encode(['jsonrpc' => '2.0', 'id' => '0', 'error' => ['code' => -32700, 'message' => 'Parse error']]) . "\n");
            fflush($stdout);
            continue;
        }

        $resp = $server->handle($req);
        if (isset($resp['method']) && $resp['method'] === 'ack') {
            continue;
        }
        fwrite($stdout, json_encode($resp) . "\n");
        fflush($stdout);
    }

    fclose($stdin);
    fclose($stdout);
}

$server = new MCPServer('meu-mcp-php', '1.0.0');

$server->registerTool(
    'exemplo',
    'Um exemplo de ferramenta',
    ['type' => 'object', 'properties' => ['nome' => ['type' => 'string']], 'required' => ['nome']],
    function(array $args): array {
        return ['content' => [['type' => 'text', 'text' => 'Olá, ' . ($args['nome'] ?? 'mundo') . '!']]];
    }
);

runStdio($server);
`,
    "composer.json": `{
    "require": {}
}`,
    "README.md": "# MCP PHP\nExecute com: php mcp_server.php\n",
}, undefined, "php mcp_server.php");
// ============ RUST ============
registerTemplate("rust", {
    "Cargo.toml": `[package]
name = "meu-mcp-rust"
version = "1.0.0"
edition = "2021"

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
`,
    "src/main.rs": `use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::io::{self, BufRead, Write};

const PROTOCOL_VERSION: &str = "2024-11-05";

#[derive(Debug, Deserialize)]
struct JSONRPCRequest {
    jsonrpc: String,
    id: Value,
    method: String,
    #[serde(default)]
    params: Option<Value>,
}

#[derive(Debug, Serialize)]
struct JSONRPCResponse {
    jsonrpc: String,
    id: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<RPCError>,
}

#[derive(Debug, Serialize)]
struct RPCError {
    code: i32,
    message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    data: Option<Value>,
}

struct MCPServer {
    name: String,
    version: String,
    instructions: Option<String>,
    initialized: bool,
}

impl MCPServer {
    fn new(name: &str, version: &str, instructions: Option<&str>) -> Self {
        Self {
            name: name.to_string(),
            version: version.to_string(),
            instructions: instructions.map(|s| s.to_string()),
            initialized: false,
        }
    }

    fn handle(&mut self, req: JSONRPCRequest) -> Value {
        match req.method.as_str() {
            "initialize" => {
                self.initialized = true;
                let mut capabilities = serde_json::Map::new();
                capabilities.insert("tools".to_string(), Value::Object(serde_json::Map::new()));
                capabilities.insert("resources".to_string(), Value::Object(serde_json::Map::new()));
                capabilities.insert("prompts".to_string(), Value::Object(serde_json::Map::new()));

                let mut server_info = serde_json::Map::new();
                server_info.insert("name".to_string(), Value::String(self.name.clone()));
                server_info.insert("version".to_string(), Value::String(self.version.clone()));

                let mut result = serde_json::Map::new();
                result.insert("protocolVersion".to_string(), Value::String(PROTOCOL_VERSION.to_string()));
                result.insert("capabilities".to_string(), Value::Object(capabilities));
                result.insert("serverInfo".to_string(), Value::Object(server_info));
                if let Some(instr) = &self.instructions {
                    result.insert("instructions".to_string(), Value::String(instr.clone()));
                }
                Value::Object(result)
            }
            "initialized" => {
                self.initialized = true;
                Value::Null // ack
            }
            "ping" => Value::Object(serde_json::Map::new()),
            _ => Value::Null,
        }
    }
}

fn write_json(val: &Value) {
    let out = serde_json::to_string(val).unwrap();
    let mut stdout = io::stdout();
    writeln!(stdout, "{}", out).unwrap();
    stdout.flush().unwrap();
}

fn main() {
    let mut server = MCPServer::new("meu-mcp-rust", "1.0.0", None);
    let stdin = io::stdin();
    for line in stdin.lock().lines() {
        let line = match line {
            Ok(l) => l,
            Err(_) => break,
        };
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let req: JSONRPCRequest = match serde_json::from_str(line) {
            Ok(r) => r,
            Err(_) => {
                write_json(&serde_json::json!({
                    "jsonrpc": "2.0",
                    "id": "0",
                    "error": {"code": -32700, "message": "Parse error"}
                }));
                continue;
            }
        };
        let resp = server.handle(req);
        if resp.is_null() {
            continue;
        }
        write_json(&serde_json::json!({
            "jsonrpc": "2.0",
            "id": req.id,
            "result": resp
        }));
    }
}
`,
    "README.md": "# MCP Rust\nExecute com: cargo run\n",
}, "cargo build", "cargo run");
// ============ CLI ============
function listLanguages() {
    return Array.from(LANG_TEMPLATES.keys());
}
function getTemplate(lang) {
    return LANG_TEMPLATES.get(lang);
}
function scaffold(lang, targetDir, projectName) {
    const tmpl = getTemplate(lang);
    if (!tmpl) {
        throw new Error(`Idioma não suportado: ${lang}. Disponíveis: ${listLanguages().join(", ")}`);
    }
    fs.mkdirSync(targetDir, { recursive: true });
    for (const [filename, content] of Object.entries(tmpl.files)) {
        const filePath = path.join(targetDir, filename);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        let finalContent = content.replace(/\{\{projectName\}\}/g, projectName);
        fs.writeFileSync(filePath, finalContent, "utf-8");
    }
    // Se houver go.mod, atualiza o nome do módulo
    const goModPath = path.join(targetDir, "go.mod");
    if (fs.existsSync(goModPath)) {
        let mod = fs.readFileSync(goModPath, "utf-8");
        mod = mod.replace(/module meu-mcp-go/, `module ${projectName}`);
        fs.writeFileSync(goModPath, mod, "utf-8");
    }
    // Se houver Cargo.toml, atualiza o nome
    const cargoPath = path.join(targetDir, "Cargo.toml");
    if (fs.existsSync(cargoPath)) {
        let cargo = fs.readFileSync(cargoPath, "utf-8");
        cargo = cargo.replace(/name = "meu-mcp-rust"/, `name = "${projectName}"`);
        fs.writeFileSync(cargoPath, cargo, "utf-8");
    }
}
//# sourceMappingURL=scaffold.js.map
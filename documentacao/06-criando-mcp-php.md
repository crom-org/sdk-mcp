# 06 — Criando um MCP em PHP

O template PHP do `sdk-mcp` usa apenas a stdlib (zero dependências externas).

## Gerar com o CLI

```bash
node dist/bin.js init php ./meu-mcp-php meu-mcp-php
```

Isso cria:

```
meu-mcp-php/
├── mcp_server.php
├── composer.json   # vazio (stdlib apenas)
└── README.md
```

## Adicionar uma ferramenta

Edite o final de `mcp_server.php`:

```php
$server = new MCPServer('meu-mcp-php', '1.0.0');

$server->registerTool(
    'somar',
    'Soma dois números',
    [
        'type' => 'object',
        'properties' => [
            'a' => ['type' => 'number'],
            'b' => ['type' => 'number'],
        ],
        'required' => ['a', 'b'],
    ],
    function(array $args): array {
        $resultado = ($args['a'] ?? 0) + ($args['b'] ?? 0);
        return ['content' => [['type' => 'text', 'text' => "Resultado: $resultado"]]];
    }
);

runStdio($server);
```

## Rodar

```bash
php mcp_server.php
```

## Conectar a um cliente

```json
{
  "mcpServers": {
    "meu-mcp-php": {
      "command": "php",
      "args": ["/caminho/para/meu-mcp-php/mcp_server.php"]
    }
  }
}
```

## Dicas PHP

- Não use `echo` para debug — use STDERR se precisar, pois `stdout` é reservado ao protocolo.
- Toda resposta deve terminar com `\n` e fazer `fflush($stdout)`.
- O template já faz isso em `runStdio`.

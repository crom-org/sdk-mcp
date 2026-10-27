#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("./index.js");
const [, , command, ...args] = process.argv;
async function main() {
    switch (command) {
        case "init": {
            const [lang, dir, name] = args;
            if (!lang || !dir || !name) {
                console.error("Uso: sdk-mcp init <linguagem> <pasta> <nome-projeto>");
                console.error("Linguagens disponíveis: " + (0, index_js_1.listLanguages)().join(", "));
                process.exit(1);
            }
            try {
                (0, index_js_1.scaffold)(lang, dir, name);
                console.log(`MCP ${lang} criado em ${dir}`);
                const { getTemplate } = await import("./index.js");
                const tmpl = getTemplate(lang);
                if (tmpl?.install) {
                    console.log(`Instale: ${tmpl.install}`);
                }
                if (tmpl?.run) {
                    console.log(`Rode: ${tmpl.run}`);
                }
            }
            catch (err) {
                console.error(err.message);
                process.exit(1);
            }
            break;
        }
        case "langs": {
            console.log("Linguagens suportadas: " + (0, index_js_1.listLanguages)().join(", "));
            break;
        }
        case "server": {
            const { buildServer } = await import("./mcp/CromMCPServer.js");
            const { StdioServerTransport } = await import("@modelcontextprotocol/sdk/server/stdio.js");
            const server = buildServer();
            const transport = new StdioServerTransport();
            await server.connect(transport);
            console.error("sdk-mcp servidor rodando em stdio");
            break;
        }
        default: {
            console.error("Comandos disponíveis: init, langs, server");
            process.exit(1);
        }
    }
}
main().catch((err) => {
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=bin.js.map
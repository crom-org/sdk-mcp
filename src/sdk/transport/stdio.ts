import * as readline from "readline";
import { MCPServer } from "../server";
import type { JSONRPCResponse } from "../types";

export class StdioTransport {
  private server: MCPServer;
  private rl?: readline.Interface;

  constructor(server: MCPServer) {
    this.server = server;
  }

  start(): void {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    this.rl.on("line", async (line: string) => {
      const response = await this.server.processLine(line);
      if (response) {
        process.stdout.write(response + "\n");
      }
    });

    this.rl.on("close", () => {
      process.exit(0);
    });
  }

  send(response: string): void {
    process.stdout.write(response + "\n");
  }

  stop(): void {
    this.rl?.close();
  }
}

export function createStdioServer(options: {
  name: string;
  version: string;
  title?: string;
  instructions?: string;
}): { server: MCPServer; transport: StdioTransport } {
  const server = new MCPServer(options);
  const transport = new StdioTransport(server);
  return { server, transport };
}

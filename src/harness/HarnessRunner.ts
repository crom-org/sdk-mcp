import { spawnSync, SpawnSyncReturns } from "child_process";
import * as fs from "fs";
import * as path from "path";
import type { HarnessConfig, HarnessExecution } from "../types";
import { EventEmitter } from "events";

export class HarnessRunner extends EventEmitter {
  private executions = new Map<string, HarnessExecution>();
  private running = new Map<string, NodeJS.Timeout>();

  run(harness: HarnessConfig, cwd?: string): HarnessExecution {
    const id = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const execution: HarnessExecution = {
      id,
      harnessId: harness.id,
      status: "running",
      startedAt: new Date(),
    };

    this.executions.set(id, execution);
    this.emit("start", execution);

    try {
      let result: SpawnSyncReturns<string>;
      let output = "";
      let exitCode = 0;
      let error: string | undefined;

      if (harness.type === "script") {
        const scriptPath = path.resolve(harness.scriptPath || "");
        if (!fs.existsSync(scriptPath)) {
          throw new Error(`Script não encontrado: ${scriptPath}`);
        }
        result = spawnSync("node", [scriptPath, ...(harness.args || [])], {
          cwd,
          env: { ...process.env, ...harness.env },
          timeout: harness.timeoutMs,
          encoding: "utf-8",
          maxBuffer: 10 * 1024 * 1024,
        });
        output = result.stdout ?? "";
        exitCode = result.status ?? 0;
        if (result.stderr) output += `\nSTDERR:\n${result.stderr}`;
      } else if (harness.type === "command") {
        const cmd = [harness.command, ...(harness.args || [])].join(" ");
        const parts = cmd.split(/\s+/);
        result = spawnSync(parts[0], parts.slice(1), {
          cwd,
          env: { ...process.env, ...harness.env },
          timeout: harness.timeoutMs,
          encoding: "utf-8",
          maxBuffer: 10 * 1024 * 1024,
        });
        output = result.stdout ?? "";
        exitCode = result.status ?? 0;
        if (result.stderr) output += `\nSTDERR:\n${result.stderr}`;
      } else {
        throw new Error(`Tipo de harness não suportado localmente: ${harness.type}`);
      }

      execution.output = output;
      execution.exitCode = exitCode;
      execution.finishedAt = new Date();
      execution.status = exitCode === 0 ? "completed" : "failed";

      if (exitCode !== 0) {
        error = `Comando saiu com código ${exitCode}`;
        execution.error = error;
      }

      this.emit("complete", execution);
    } catch (err: any) {
      execution.finishedAt = new Date();
      execution.status = "failed";
      execution.error = err?.message || String(err);
      execution.exitCode = err?.code;
      execution.output = err?.stdout || "";
      this.emit("error", execution);
    }

    this.executions.set(id, execution);
    return execution;
  }

  async runWithRetries(harness: HarnessConfig, cwd?: string): Promise<HarnessExecution> {
    let last: HarnessExecution | undefined;

    for (let attempt = 0; attempt <= harness.retryCount; attempt++) {
      last = this.run(harness, cwd);
      if (last.status === "completed") {
        return last;
      }
      if (attempt < harness.retryCount) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    return last!;
  }

  getExecution(id: string): HarnessExecution | undefined {
    return this.executions.get(id);
  }

  getAllExecutions(): HarnessExecution[] {
    return Array.from(this.executions.values()).sort(
      (a, b) => (b.startedAt?.getTime() ?? 0) - (a.startedAt?.getTime() ?? 0)
    );
  }

  cancel(id: string): boolean {
    const execution = this.executions.get(id);
    if (!execution || execution.status !== "running") {
      return false;
    }
    execution.status = "cancelled";
    execution.finishedAt = new Date();
    this.executions.set(id, execution);
    this.emit("cancel", execution);
    return true;
  }

  clearExecutions(): void {
    this.executions.clear();
  }
}

export const harnessRunner = new HarnessRunner();

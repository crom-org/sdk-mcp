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
exports.harnessRunner = exports.HarnessRunner = void 0;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const events_1 = require("events");
class HarnessRunner extends events_1.EventEmitter {
    executions = new Map();
    running = new Map();
    run(harness, cwd) {
        const id = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const execution = {
            id,
            harnessId: harness.id,
            status: "running",
            startedAt: new Date(),
        };
        this.executions.set(id, execution);
        this.emit("start", execution);
        try {
            let result;
            let output = "";
            let exitCode = 0;
            let error;
            if (harness.type === "script") {
                const scriptPath = path.resolve(harness.scriptPath || "");
                if (!fs.existsSync(scriptPath)) {
                    throw new Error(`Script não encontrado: ${scriptPath}`);
                }
                result = (0, child_process_1.spawnSync)("node", [scriptPath, ...(harness.args || [])], {
                    cwd,
                    env: { ...process.env, ...harness.env },
                    timeout: harness.timeoutMs,
                    encoding: "utf-8",
                    maxBuffer: 10 * 1024 * 1024,
                });
                output = result.stdout ?? "";
                exitCode = result.status ?? 0;
                if (result.stderr)
                    output += `\nSTDERR:\n${result.stderr}`;
            }
            else if (harness.type === "command") {
                const cmd = [harness.command, ...(harness.args || [])].join(" ");
                const parts = cmd.split(/\s+/);
                result = (0, child_process_1.spawnSync)(parts[0], parts.slice(1), {
                    cwd,
                    env: { ...process.env, ...harness.env },
                    timeout: harness.timeoutMs,
                    encoding: "utf-8",
                    maxBuffer: 10 * 1024 * 1024,
                });
                output = result.stdout ?? "";
                exitCode = result.status ?? 0;
                if (result.stderr)
                    output += `\nSTDERR:\n${result.stderr}`;
            }
            else {
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
        }
        catch (err) {
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
    async runWithRetries(harness, cwd) {
        let last;
        for (let attempt = 0; attempt <= harness.retryCount; attempt++) {
            last = this.run(harness, cwd);
            if (last.status === "completed") {
                return last;
            }
            if (attempt < harness.retryCount) {
                await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
            }
        }
        return last;
    }
    getExecution(id) {
        return this.executions.get(id);
    }
    getAllExecutions() {
        return Array.from(this.executions.values()).sort((a, b) => (b.startedAt?.getTime() ?? 0) - (a.startedAt?.getTime() ?? 0));
    }
    cancel(id) {
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
    clearExecutions() {
        this.executions.clear();
    }
}
exports.HarnessRunner = HarnessRunner;
exports.harnessRunner = new HarnessRunner();
//# sourceMappingURL=HarnessRunner.js.map
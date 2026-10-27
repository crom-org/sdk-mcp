import type { HarnessConfig, HarnessExecution } from "../types";
import { EventEmitter } from "events";
export declare class HarnessRunner extends EventEmitter {
    private executions;
    private running;
    run(harness: HarnessConfig, cwd?: string): HarnessExecution;
    runWithRetries(harness: HarnessConfig, cwd?: string): Promise<HarnessExecution>;
    getExecution(id: string): HarnessExecution | undefined;
    getAllExecutions(): HarnessExecution[];
    cancel(id: string): boolean;
    clearExecutions(): void;
}
export declare const harnessRunner: HarnessRunner;
//# sourceMappingURL=HarnessRunner.d.ts.map
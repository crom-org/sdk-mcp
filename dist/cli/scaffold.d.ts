export declare function listLanguages(): string[];
export declare function getTemplate(lang: string): {
    files: Record<string, string>;
    install?: string;
    run?: string;
} | undefined;
export declare function scaffold(lang: string, targetDir: string, projectName: string): void;
//# sourceMappingURL=scaffold.d.ts.map
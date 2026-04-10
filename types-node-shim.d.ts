declare module 'node:fs/promises' {
  export function readdir(path: string, options?: { withFileTypes?: boolean }): Promise<Array<{ name: string; isDirectory(): boolean }>>;
  export function mkdtemp(prefix: string): Promise<string>;
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>;
  export function writeFile(path: string, data: string): Promise<void>;
  export function readFile(path: string, encoding: string): Promise<string>;
}


declare module 'node:path' {
  export function join(...parts: string[]): string;
  export function basename(path: string, suffix?: string): string;
  export function extname(path: string): string;
  export function dirname(path: string): string;
}

declare module 'ai' {
  export const generateObject: (args: {
    model: unknown;
    schema: unknown;
    prompt: string;
    system: string;
  }) => Promise<{ object: any }>;
}

declare module '@ai-sdk/openai-compatible' {
  export const createOpenAICompatible: (args: {
    name: string;
    baseURL: string;
    apiKey: string;
  }) => (modelId: string) => unknown;
}

declare const process: {
  env: Record<string, string | undefined>;
  cwd(): string;
};

declare module 'node:readline/promises' {
  export function createInterface(args: { input: unknown; output: unknown }): {
    question(query: string): Promise<string>;
    close(): void;
  };
}

declare module 'node:process' {
  export const stdin: unknown;
  export const stdout: unknown;
}

declare module 'node:http' {
  export function createServer(handler: (req: any, res: any) => void): {
    listen(port: number, cb?: () => void): void;
  };
}

declare const Buffer: {
  from(input: string): { toString(enc?: string): string };
};

/**
 * Minimal typings for the experimental `node:sqlite` module until @types/node
 * ships them. Only the surface used by src/lib/db.ts is declared.
 */
declare module 'node:sqlite' {
  export interface DatabaseSyncOptions {
    open?: boolean;
    readOnly?: boolean;
    enableForeignKeyConstraints?: boolean;
    enableDoubleQuotedStringLiterals?: boolean;
  }

  export interface RunResult {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  }

  export type SupportedValueType = null | number | bigint | string | Uint8Array;

  export class StatementSync {
    run(...params: SupportedValueType[]): RunResult;
    get(...params: SupportedValueType[]): unknown;
    all(...params: SupportedValueType[]): unknown[];
    iterate(...params: SupportedValueType[]): IterableIterator<unknown>;
    columns(): { name: string; type: string | null; database: string | null; table: string | null }[];
    finalize(): void;
  }

  export class DatabaseSync {
    constructor(location: string | Buffer | URL, options?: DatabaseSyncOptions);
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}

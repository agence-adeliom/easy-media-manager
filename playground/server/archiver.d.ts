declare module 'archiver' {
  interface Archive {
    on(event: string, callback: (err?: Error) => void): void;
    pipe(destination: any): void;
    finalize(): Promise<void>;
  }

  function archiver(format: string, options?: any): Archive;
  export = archiver;
}

// Ambient declaration for Angular $localize to satisfy TypeScript in non-template TS files
// This is safe because @angular/localize/init loads the implementation at runtime via polyfills.ts
// If @angular/localize types are present, this will merge rather than conflict.
declare const $localize: (strings: TemplateStringsArray, ...args: any[]) => string;

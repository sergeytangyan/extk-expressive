import { defineConfig } from 'tsup';


export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'], // Build for commonJS and ESmodules
    target: ['es2022'],
    dts: true, // Generate declaration file (.d.ts)
    splitting: false,
    sourcemap: false,
    clean: true,
    skipNodeModulesBundle: true,
    cjsInterop: true,
});

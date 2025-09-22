import expressiveConfig from '@extk/eslint-config';
import { defineConfig } from 'eslint/config';


// to make this a .ts file you first need to install 'jiti'...

export default defineConfig({
    extends: [
        expressiveConfig,
    ],
});

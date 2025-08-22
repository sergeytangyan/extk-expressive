import dotenv from 'dotenv';
import type { OtherString } from './types/common';


dotenv.config();

export function isDev() {
    return getEnvVar('ENV') === 'dev';
}

export function isProd() {
    return getEnvVar('ENV') === 'prod';
}

export function getEnvVar(configName: string) {
    const config = process.env[configName];

    if (!config) {
        throw new Error(`Missing config '${configName}'`);
    }

    return config;
}

export type Env = 'dev' | 'prod' | OtherString;

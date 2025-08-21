import dotenv from 'dotenv';
import type { OtherString } from './types/common';


dotenv.config();

export const config = {
    env: getConfig('ENV') as ('dev' | 'stage' | 'prod' | OtherString),
};

export function getConfig(configName: string) {
    const config = process.env[configName];

    if (!config) {
        throw new Error(`Missing config '${configName}'`);
    }

    return config;
}

export type Config = typeof config;

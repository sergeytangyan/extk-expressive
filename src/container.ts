import type { Logger } from 'winston';
import { getDefaultFileLogger } from './logger';
import type { AlertHandler } from './types/common';


export const container: {
    _logger?: Logger;
    logger: Logger;
    alertHandler?: AlertHandler; // no default AlertHandler
} = {
    get logger() {
        if (!this._logger) {
            this._logger = getDefaultFileLogger('app'); // <--- default logger
        }

        return this._logger;
    },

    set logger(logger: Logger) {
        this._logger = logger;
    },
};

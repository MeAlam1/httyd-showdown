import {LogColorProvider} from './LogColorProvider.js';
import {Constants} from "../../Constants.js";

export class Logger {
    #colorProvider;

    constructor(pColorProvider = new LogColorProvider()) {
        this.#colorProvider = pColorProvider;
    }

    formatTimestamp() {
        return new Date().toLocaleTimeString('en-US', {hour12: false});
    }

    log(pLevel, pMessage, pError = null) {
        if (!Constants.isLoggingEnabled) return;
        const color = this.#colorProvider.getColor(pLevel);
        const ansiColor = this.#colorProvider.rgbToAnsi(color);
        const RESET = '\u001B[0m';
        const timestamp = this.formatTimestamp();
        let output = `${ansiColor}[${timestamp}] [${pLevel}]: ${pMessage}${RESET}`;

        if (pError) {
            output += `\nException: ${pError.message}`;
            if (pError.stack) {
                output += '\n' + pError.stack.split('\n').slice(1).map(line => `\t${line.trim()}`).join('\n');
            }
        }

        console.log(output);
    }

    logSupplier(pLevel, pMessageSupplier) {
        const message = typeof pMessageSupplier === 'function' ? pMessageSupplier() : String(pMessageSupplier);
        this.log(pLevel, message);
    }
}
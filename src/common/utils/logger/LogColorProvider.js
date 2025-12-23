export class LogColorProvider {
    constructor() {
        this.colors = {
            ERROR: 0xFF0000,
            WARNING: 0xFFA500,
            INFO: 0x0000FF,
            SUCCESS: 0x00FF00,
            DEFAULT: 0xFFFFFF
        };
    }

    getColor(pLevel) {
        return this.colors[pLevel.toString()] || this.colors.DEFAULT;
    }

    rgbToAnsi(pRgb) {
        const r = (pRgb >> 16) & 0xFF;
        const g = (pRgb >> 8) & 0xFF;
        const b = pRgb & 0xFF;
        return `\u001B[38;2;${r};${g};${b}m`;
    }
}
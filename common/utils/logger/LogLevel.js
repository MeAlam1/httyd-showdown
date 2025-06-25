export class LogLevel {
    static ERROR = new LogLevel('ERROR');
    static WARNING = new LogLevel('WARNING');
    static INFO = new LogLevel('INFO');
    static SUCCESS = new LogLevel('SUCCESS');

    constructor(pName) {
        this.name = pName;
    }

    toString() {
        return this.name;
    }
}
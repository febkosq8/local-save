export default class Logger {
    constructor() {
        throw new Error('This class cannot be instantiated.');
    }
    static log(message: string, ...args: unknown[]) {
        console.log(`[LocalSave | LOG] ${message}\n`, ...args);
    }
    static warn(message: string, ...args: unknown[]) {
        console.warn(`[LocalSave | WARN] ${message}\n`, ...args);
    }
    static error(message: string, ...args: unknown[]) {
        console.error(`[LocalSave | ERROR] ${message}\n`, ...args);
    }
    static info(message: string, ...args: unknown[]) {
        console.info(`[LocalSave | INFO] ${message}\n`, ...args);
    }
    static debug(message: string, ...args: unknown[]) {
        console.debug(`[LocalSave | DEBUG] ${message}\n`, ...args);
    }
}

/** @format */

export default class Logger {
    constructor() {
        throw new Error('This class cannot be instantiated.');
    }
    static log(message: string, ...args: unknown[]) {
        console.log(`[LocalSave | LOG] ${message}`, ...args);
    }
    static warn(message: string, ...args: unknown[]) {
        console.warn(`[LocalSave | WARN] ${message}`, ...args);
    }
    static error(message: string, ...args: unknown[]) {
        console.error(`[LocalSave | ERROR] ${message}`, ...args);
    }
    static info(message: string, ...args: unknown[]) {
        console.info(`[LocalSave | INFO] ${message}`, ...args);
    }
    static debug(message: string, ...args: unknown[]) {
        console.debug(`[LocalSave | DEBUG] ${message}`, ...args);
    }
}

export default class LocalSaveConfigError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'LocalSaveConfigError';
    }
}

export default class LocalSaveError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'LocalSaveError';
    }
}

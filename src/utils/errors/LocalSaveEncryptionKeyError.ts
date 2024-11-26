export default class LocalSaveEncryptionKeyError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'LocalSaveEncryptionKeyError';
    }
}
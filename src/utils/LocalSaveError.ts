/** @format */

export default class LocalSaveError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(`LocalSave | ${message}`, options);
        this.name = 'LocalSaveError';
    }
}

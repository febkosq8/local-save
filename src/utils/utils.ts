/**
 * Validates the encryption key.
 *
 * This function checks if the provided key has a valid length.
 * The valid lengths for the encryption key are 16, 24, or 32 characters.
 *
 * @param key - The encryption key to validate.
 * @returns `true` if the key length is valid, otherwise `false`.
 */

export function isValidEncryptionKey(key: string) {
    return key.length > 0 && [16, 24, 32].includes(key.length);
}

/**
 * Converts an ArrayBuffer to a Base64 encoded string.
 *
 * @internal
 *
 * @param ArrayBuffer - The ArrayBuffer to convert.
 *
 * @returns The Base64 encoded string representation of the ArrayBuffer.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

/**
 * Converts a base64 encoded string to an ArrayBuffer.
 *
 * @internal
 *
 * @param base64 - The base64 encoded string to convert.
 *
 * @returns The resulting ArrayBuffer.
 */
export function base64ToArrayBuffer(base64: string) {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer as ArrayBuffer;
}

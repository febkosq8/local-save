import type { DBItem, DBItemEncryptedBase64, EncryptionKey } from '@local-save/types';
import LocalSaveEncryptionKeyError from '@local-save/utils/errors/LocalSaveEncryptionKeyError';
import LocalSaveError from '@local-save/utils/errors/LocalSaveError';
import Logger from '@local-save/utils/logger';
import {
    arrayBufferToBase64,
    base64ToArrayBuffer,
    isEncryptionKeyDefined,
    isValidEncryptionKey,
} from '@local-save/utils/utils';

interface LocalSaveCryptoConfig {
    getEncryptionKey: () => EncryptionKey | undefined;
    isLoggingEnabled: () => boolean;
}

/**
 * Handles AES-GCM encryption/decryption concerns for LocalSave.
 *
 * - Lazily initializes text encoder/decoder.
 * - Caches imported CryptoKey while the source key string remains unchanged.
 * - Preserves LocalSave error behavior for key validation and decrypt failures.
 */
export class LocalSaveCrypto {
    private textEncoder?: TextEncoder;
    private textDecoder?: TextDecoder;
    private cachedCryptoKeyPromise?: Promise<CryptoKey>;
    private cachedCryptoKeySource?: EncryptionKey;

    private readonly getEncryptionKey: () => EncryptionKey | undefined;
    private readonly isLoggingEnabled: () => boolean;

    /**
     * Creates a crypto helper bound to runtime callbacks from LocalSave.
     *
     * @param config Runtime callbacks for key retrieval and logging state.
     */
    constructor(config: LocalSaveCryptoConfig) {
        this.getEncryptionKey = config.getEncryptionKey;
        this.isLoggingEnabled = config.isLoggingEnabled;
    }

    /**
     * Returns a lazily initialized TextEncoder instance.
     *
     * @internal
     * @returns {TextEncoder} A reusable TextEncoder instance for UTF-8 encoding.
     */
    private getTextEncoder(): TextEncoder {
        if (!this.textEncoder) {
            this.textEncoder = new TextEncoder();
        }
        return this.textEncoder;
    }

    /**
     * Returns a lazily initialized TextDecoder instance.
     *
     * @internal
     * @returns {TextDecoder} A reusable TextDecoder instance for UTF-8 decoding.
     */
    private getTextDecoder(): TextDecoder {
        if (!this.textDecoder) {
            this.textDecoder = new TextDecoder();
        }
        return this.textDecoder;
    }

    /**
     * Retrieves the encryption key as an imported CryptoKey object.
     *
     * @internal
     * @returns {Promise<CryptoKey>} A promise that resolves to a CryptoKey object.
     *
     * @throws {LocalSaveEncryptionKeyError} If the encryption key is not configured.
     * @throws {LocalSaveEncryptionKeyError} If the encryption key contains whitespace or has invalid length.
     */
    private async getEncryptKey(): Promise<CryptoKey> {
        const sourceKey = this.getEncryptionKey();
        if (!isEncryptionKeyDefined(sourceKey)) {
            throw new LocalSaveEncryptionKeyError(`Encryption key is not configured`);
        }
        if (!isValidEncryptionKey(sourceKey)) {
            throw new LocalSaveEncryptionKeyError(
                'Encryption key should not contain spaces and should be of length 16, 24, or 32 characters',
            );
        }
        if (this.cachedCryptoKeyPromise && this.cachedCryptoKeySource === sourceKey) {
            return this.cachedCryptoKeyPromise;
        }

        const keyBytes = this.getTextEncoder().encode(sourceKey);
        const importPromise = crypto.subtle
            .importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
            .then((key) => {
                if (this.isLoggingEnabled()) {
                    Logger.debug(`Encryption key retrieved successfully`, {
                        keyLength: sourceKey.length,
                        keyBytesLength: keyBytes.length,
                    });
                }
                return key;
            })
            .catch((error) => {
                if (this.cachedCryptoKeyPromise === importPromise) {
                    this.cachedCryptoKeyPromise = undefined;
                    this.cachedCryptoKeySource = undefined;
                }
                throw error;
            });

        this.cachedCryptoKeySource = sourceKey;
        this.cachedCryptoKeyPromise = importPromise;

        return importPromise;
    }

    /**
     * Encrypts the provided data using AES-GCM.
     *
     * - Generates a random 12-byte IV for each encryption.
     * - Returns a base64 payload containing IV + ciphertext bytes.
     *
     * @param data The record to encrypt.
     * @returns {Promise<DBItemEncryptedBase64>} A promise that resolves to encrypted base64 payload.
     *
     * @throws {LocalSaveEncryptionKeyError} If encryption key is not configured.
     * @throws {LocalSaveError} If encryption fails.
     */
    async encryptData(data: DBItem): Promise<DBItemEncryptedBase64> {
        try {
            if (!isEncryptionKeyDefined(this.getEncryptionKey())) {
                throw new LocalSaveEncryptionKeyError(`Encryption key is not configured`);
            }
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const generatedKey = await this.getEncryptKey();
            const dataBuffer = this.getTextEncoder().encode(JSON.stringify(data));
            const encryptedData = await window.crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv,
                },
                generatedKey,
                dataBuffer,
            );
            const ivUint8 = new Uint8Array(iv);
            const encryptedDataUint8 = new Uint8Array(encryptedData);
            const concatenatedArray = new Uint8Array(ivUint8.byteLength + encryptedDataUint8.byteLength);
            concatenatedArray.set(ivUint8, 0);
            concatenatedArray.set(encryptedDataUint8, ivUint8.byteLength);
            const base64Data = arrayBufferToBase64(concatenatedArray.buffer);
            if (this.isLoggingEnabled()) {
                Logger.debug(`Data encrypted successfully`, {
                    base64DataLength: base64Data.length,
                });
            }
            return base64Data;
        } catch (error) {
            if (this.isLoggingEnabled()) {
                Logger.error(`Data encryption failed`, error);
            }
            throw error;
        }
    }

    /**
     * Decrypts a base64 payload produced by LocalSave encryption format.
     *
     * @param encryptedBase64Data Data payload encoded as base64 string.
     * @returns {Promise<DBItem>} A promise that resolves to the decrypted DBItem object.
     *
     * @throws {LocalSaveEncryptionKeyError} If encryption key is not configured.
     * @throws {LocalSaveError} If decryption fails.
     */
    async decryptData(encryptedBase64Data: string): Promise<DBItem> {
        try {
            if (!isEncryptionKeyDefined(this.getEncryptionKey())) {
                throw new LocalSaveEncryptionKeyError(`Encryption key is not configured`);
            }
            const arrayBuffer = base64ToArrayBuffer(encryptedBase64Data);
            const iv = new Uint8Array(arrayBuffer, 0, 12);
            const generatedKey = await this.getEncryptKey();
            const encryptedData = new Uint8Array(arrayBuffer, 12);
            const decryptedBufferData = await window.crypto.subtle.decrypt(
                {
                    name: 'AES-GCM',
                    iv,
                },
                generatedKey,
                encryptedData,
            );
            const decryptedData = JSON.parse(this.getTextDecoder().decode(decryptedBufferData)) as DBItem;
            if (this.isLoggingEnabled()) {
                Logger.debug(`Data decrypted successfully`, {
                    timestamp: decryptedData.timestamp,
                });
            }
            return decryptedData;
        } catch (error) {
            if (this.isLoggingEnabled()) {
                Logger.error(`Data decryption failed`, error);
            }
            throw new LocalSaveError(`Data decryption failed`, {
                cause: error instanceof Error ? error : undefined,
            });
        }
    }
}

import LocalSaveEncryptionKeyError from 'src/utils/errors/LocalSaveEncryptionKeyError';
import LocalSaveError from 'src/utils/errors/LocalSaveError';
import Logger from 'src/utils/logger';
import {
    arrayBufferToBase64,
    base64ToArrayBuffer,
    isEncryptionKeyDefined,
    isValidEncryptionKey,
} from 'src/utils/utils';

class LocalSave {
    dbName: DBName = 'LocalSave';
    encryptionKey?: EncryptionKey;
    categories: Category[] = ['userData'];
    expiryThreshold: number = 30;
    clearOnDecryptError: boolean = true;
    printLogs: boolean = false;
    constructor(config?: Config) {
        this.dbName = config?.dbName ?? this.dbName;
        this.encryptionKey = config?.encryptionKey;
        this.categories = config?.categories ?? this.categories;
        this.expiryThreshold = config?.expiryThreshold ?? this.expiryThreshold;
        this.clearOnDecryptError = config?.clearOnDecryptError ?? this.clearOnDecryptError;
        this.printLogs = config?.printLogs ?? this.printLogs;

        if (!!config?.encryptionKey && !isValidEncryptionKey(config?.encryptionKey)) {
            Logger.warn(`Encryption key should be of length 16, 24, or 32 characters`, {
                keyLength: config.encryptionKey.length,
            });
        }
    }

    /**
     * Opens a connection to the IndexedDB database.
     * It handles the database versioning and ensures that the required object stores are created if they do not exist.
     *
     * @internal
     *
     * @param version - The version of the database to open. Optional.
     *
     * @returns A promise that resolves to the opened 'IDBDatabase' instance.
     */
    private openDB(version?: number) {
        return new Promise<IDBDatabase>((resolve, reject) => {
            const openRequest = indexedDB.open(this.dbName, version);
            openRequest.onupgradeneeded = () => {
                const db = openRequest.result;
                if (this.printLogs) {
                    Logger.debug(`Database upgrade triggered`, {
                        dbName: this.dbName,
                        version: db.version,
                    });
                }
                for (const category of this.categories) {
                    if (!db.objectStoreNames.contains(category)) {
                        if (this.printLogs) {
                            Logger.debug(`Creating object store`, {
                                category,
                            });
                        }
                        db.createObjectStore(category);
                    }
                }
            };
            openRequest.onsuccess = () => {
                if (this.printLogs) {
                    Logger.debug(`Database opened successfully`, {
                        dbName: this.dbName,
                        version: openRequest.result.version,
                    });
                }
                return resolve(openRequest.result);
            };
            openRequest.onerror = () => {
                if (this.printLogs) {
                    Logger.error(`LocalSaveError opening database [dbName:${this.dbName}]`, openRequest.error);
                }
                return reject(new LocalSaveError(openRequest.error?.message ?? 'Error opening database'));
            };
        });
    }

    /**
     * Retrieves an object store from the IndexedDB database.
     * It handles the transaction mode and ensures that the requested object store is returned.
     *
     * If the object store does not exist in the database and the category is valid, it will create a new version of the database with the object store.
     *
     * @internal
     *
     * @param category - The name of the object store to retrieve.
     * @param mode - The mode for the transaction (default is "readonly").
     *
     * @returns A promise that resolves to the requested object store.
     *
     * @throws {LocalSaveError} Will throw an error if the object store does not exist in the database and the category is invalid
     */
    private async getStore(category: Category, mode: IDBTransactionMode = 'readonly') {
        let db = await this.openDB();
        if (!db.objectStoreNames.contains(category) && this.categories.includes(category)) {
            if (this.printLogs) {
                Logger.debug(
                    `Requested object store not found in current database version.\nTriggering database upgrade to create object store.`,
                    {
                        category,
                        dbName: this.dbName,
                        version: db.version,
                    },
                );
            }
            const currVersion = db.version;
            db.close();
            db = await this.openDB(currVersion + 1);
        } else if (!db.objectStoreNames.contains(category)) {
            throw new LocalSaveError(
                `Requested object store not found in current database version [category:${category} / dbName:${this.dbName} / version:${db.version}].`,
            );
        }
        const transaction = db.transaction(category, mode);
        const store = transaction.objectStore(category);
        if (this.printLogs) {
            Logger.debug(`Object store retrieved from database`, {
                category,
                mode,
                dbName: this.dbName,
                version: db.version,
            });
        }
        return store;
    }

    /**
     * Retrieves the encryption key as a CryptoKey object.
     *
     * @internal
     * @returns A promise that resolves to a CryptoKey object.
     *
     * @throws {LocalSaveEncryptionKeyError} If the encryption key is not configured.
     * @throws {LocalSaveEncryptionKeyError} If the encryption key length is not 16, 24, or 32 characters.
     */
    private async getEncryptKey() {
        if (!isEncryptionKeyDefined(this.encryptionKey)) {
            throw new LocalSaveEncryptionKeyError(`Encryption key is not configured`);
        }
        if (!!this.encryptionKey && !isValidEncryptionKey(this.encryptionKey)) {
            throw new LocalSaveEncryptionKeyError('Encryption key should be of length 16, 24, or 32 characters');
        }
        const encoder = new TextEncoder();
        const keyBytes = encoder.encode(this.encryptionKey);
        const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
        if (this.printLogs) {
            Logger.debug(`Encryption key retrieved successfully`, {
                keyLength: this.encryptionKey?.length,
                keyBytesLength: keyBytes.length,
            });
        }
        return key;
    }

    /**
     * Encrypts the provided data using AES-GCM encryption with the help of SubtleCrypto API.
     * Refer to https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt for more technical details.
     *
     * Generates a random 12-byte IV for each encryption.
     * Base64 encodes the IV and the encrypted data and returns the result as a string.
     *
     * If no encryption key is configured, it returns the data as is.
     *
     * @internal
     *
     * @param data The data to be encrypted. Should be an instance of DBItem.
     *
     * @returns A promise that resolves to the encrypted data as a base64 encoded string.
     *
     * @throws {LocalSaveEncryptionKeyError} If the encryption key is not configured.
     * @throws {LocalSaveError} If the encryption process fails.
     */
    private async encryptData(data: DBItem) {
        try {
            if (!isEncryptionKeyDefined(this.encryptionKey)) {
                throw new LocalSaveEncryptionKeyError(`Encryption key is not configured`);
            }
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const generatedKey = await this.getEncryptKey();
            const dataBuffer = new TextEncoder().encode(JSON.stringify(data));
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
            if (this.printLogs) {
                Logger.debug(`Data encrypted successfully`, {
                    base64DataLength: base64Data.length,
                });
            }
            return base64Data;
        } catch (error) {
            if (this.printLogs) {
                Logger.error(`Data encryption failed`, error);
            }
            throw error;
        }
    }

    /**
     * Decrypts the provided data using the configured encryption key.
     * If no encryption key is configured, it returns the data as is.
     *
     * @param encryptedBase64Data The data to decrypt, as a string.
     *
     * @returns The decrypted data as an object.
     *
     * @throws {LocalSaveEncryptionKeyError} If the encryption key is not configured.
     * @throws {LocalSaveError} If the decryption process fails.
     */
    async decryptData(encryptedBase64Data: string) {
        try {
            if (!isEncryptionKeyDefined(this.encryptionKey)) {
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
            const decryptedData = JSON.parse(new TextDecoder().decode(decryptedBufferData)) as DBItem;
            if (this.printLogs) {
                Logger.debug(`Data decrypted successfully`, {
                    timestamp: decryptedData.timestamp,
                });
            }
            return decryptedData;
        } catch (error) {
            if (this.printLogs) {
                Logger.error(`Data decryption failed`, error);
            }
            throw new LocalSaveError(`Data decryption failed`);
        }
    }

    /**
     * Stores data in the specified category with the given item key.
     * If encryption key is configured, the data is encrypted first before being stored.
     *
     * @param category The category under which the data should be stored.
     * @param itemKey The key to identify the stored data.
     * @param data The data to be stored.
     *
     * @returns A promise that resolves to `true` if the operation was successful.
     *
     * @throws {LocalSaveError} Will reject the promise if an error occurs during the saving process.
     */
    async set(category: Category, itemKey: string, data: unknown) {
        let payload: DBItem | DBItemEncryptedBase64 = {
            timestamp: Date.now(),
            data,
        };
        try {
            if (this.encryptionKey) {
                payload = await this.encryptData(payload);
            }
            const store = await this.getStore(category, 'readwrite');
            return new Promise<true>((resolve, reject) => {
                const putRequest = store.put(payload, itemKey);
                putRequest.onsuccess = () => {
                    if (this.printLogs) {
                        Logger.debug(`Data stored successfully`, {
                            category,
                            itemKey,
                        });
                    }
                    resolve(true);
                };
                putRequest.onerror = () => {
                    if (this.printLogs) {
                        Logger.error(
                            `LocalSaveError storing data [category:${category} / key:${itemKey}]`,
                            putRequest.error,
                        );
                    }
                    reject(new LocalSaveError(putRequest.error?.message ?? 'Error storing data'));
                };
            });
        } catch (error) {
            if (this.printLogs) {
                Logger.error(`Data storing failed`, error);
            }
            throw error;
        }
    }

    /**
     * Retrieves an item from the specified category in the IndexedDB.
     * If the item is not found, the promise resolves to 'null'.
     * If an encryption key is configured, the data is decrypted before being returned.
     *
     * @param category The category from which to retrieve the item.
     * @param itemKey The key of the item to retrieve.
     *
     * @returns A promise that resolves to the retrieved item or null if not found.
     *
     * @throws {LocalSaveError} Will reject the promise if an error occurs while decrypting the data. Depending on the 'clearOnDecryptError' configuration, all data for the category can be cleared.
     * @throws {LocalSaveError} Will reject the promise if an error occurs during the retrieval process.
     */
    async get(category: Category, itemKey: string) {
        const store = await this.getStore(category);
        return new Promise<DBItem | null>((resolve, reject) => {
            const getRequest = store.get(itemKey);
            getRequest.onsuccess = async () => {
                let result = getRequest.result as DBItemEncryptedBase64 | DBItem | null;
                if (!result) {
                    if (this.printLogs) {
                        Logger.debug(`No data was found`, {
                            category,
                            itemKey,
                        });
                    }
                    return resolve(null);
                }
                if (typeof result === 'string') {
                    try {
                        result = await this.decryptData(result);
                    } catch (error) {
                        if (this.printLogs) {
                            Logger.error(`Failed to get data`, error);
                        }
                        if (this.clearOnDecryptError) {
                            if (this.printLogs) {
                                Logger.error(`Triggering clear for all data for category since decryption failed`);
                            }
                            void this.clear(category);
                        }
                        return reject(
                            new LocalSaveError(error instanceof Error ? error.message : 'Failed to decrypt data'),
                        );
                    }
                }
                if (this.printLogs) {
                    Logger.debug(`Data retrieved successfully`, {
                        category,
                        itemKey,
                        timestamp: result.timestamp,
                    });
                }
                Object.setPrototypeOf(result, { toJSON: () => result.data });
                return resolve(result);
            };
            getRequest.onerror = () => {
                return reject(new LocalSaveError(getRequest.error?.message ?? 'Error getting data'));
            };
        });
    }

    /**
     * Removes an entry from the specified category and the specific itemKey in the IndexedDB store.
     *
     * @param category The category from which the item should be removed.
     * @param itemKey The key of the item to be removed.
     *
     * @returns A promise that resolves to `true` if the operation was successful.
     *
     * @throws {LocalSaveError} Will reject the promise if an error occurs during the removal process.
     */
    async remove(category: Category, itemKey: string) {
        const store = await this.getStore(category, 'readwrite');
        return new Promise<true>((resolve, reject) => {
            const deleteRequest = store.delete(itemKey);
            deleteRequest.onsuccess = () => {
                if (this.printLogs) {
                    Logger.debug(`Data removed successfully`, {
                        category,
                        itemKey,
                    });
                }
                return resolve(true);
            };
            deleteRequest.onerror = () => {
                if (this.printLogs) {
                    Logger.error(
                        `Failed to remove data from [category:${category} / key:${itemKey}]`,
                        deleteRequest.error,
                    );
                }
                return reject(new LocalSaveError(deleteRequest.error?.message ?? 'Error removing data'));
            };
        });
    }

    /**
     * Clears all entries in the specified category.
     *
     * @param category - The category to clear.
     *
     * @returns A promise that resolves to `true` if the operation was successful.
     *
     * @throws {LocalSaveError} Will reject the promise if an error occurs during the clearing process.
     */
    async clear(category: Category) {
        const store = await this.getStore(category, 'readwrite');
        return new Promise<true>((resolve, reject) => {
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => {
                if (this.printLogs) {
                    Logger.debug(`Data cleared successfully`, {
                        category,
                        dbName: this.dbName,
                        version: store.transaction.db.version,
                    });
                }
                return resolve(true);
            };
            clearRequest.onerror = () => {
                if (this.printLogs) {
                    Logger.error(
                        `LocalSaveError clearing data [category:${category} / dbName:${this.dbName} / version:${store.transaction.db.version}]`,
                        clearRequest.error,
                    );
                }
                return reject(new LocalSaveError(clearRequest.error?.message ?? 'Error clearing data'));
            };
        });
    }

    /**
     * Expires data older than the specified number of days.
     *
     * This method iterates through all categories and removes items that have a timestamp
     * older than the specified number of days from the current date.
     *
     * @param {number} [days=this.expiryThreshold] The number of days to use as the threshold for expiring data.
     * Defaults to expiryThreshold from config if not provided.
     *
     * @returns A promise that resolves to `true` if the operation was successful.
     *
     * @throws {LocalSaveError} - Throws an error if there is an issue accessing the store or removing items.
     */
    async expire(days: number = this.expiryThreshold): Promise<true> {
        const checkDate = Date.now() - days * 86400000;
        for (const category of this.categories) {
            const store = await this.getStore(category);
            try {
                const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
                    const keysRequest = store.getAllKeys();
                    keysRequest.onsuccess = () => {
                        if (this.printLogs) {
                            Logger.debug(`Keys retrieved successfully for expiring data`, {
                                category,
                                keys: keysRequest.result,
                            });
                        }
                        resolve(keysRequest.result);
                    };
                    keysRequest.onerror = () => {
                        if (this.printLogs) {
                            Logger.error(
                                `LocalSaveError getting keys for expiring data [category:${category}]`,
                                keysRequest.error,
                            );
                        }
                        reject(new LocalSaveError(keysRequest.error?.message ?? 'Error getting keys'));
                    };
                });
                for (const key of keys) {
                    if (typeof key !== 'string') continue;
                    const item = await this.get(category, key);
                    if (item && item.timestamp < checkDate) {
                        if (this.printLogs) {
                            Logger.debug(`Removing expired data`, {
                                category,
                                key,
                                timestamp: item.timestamp,
                            });
                        }
                        await this.remove(category, key);
                    }
                }
            } catch (error) {
                if (this.printLogs) {
                    Logger.error(`Expiring data older than '${days}' days failed`, error);
                }
                throw error;
            }
        }
        return true;
    }

    /**
     * Asynchronously destroys the database by deleting it from IndexedDB.
     *
     * @returns A promise that resolves to `true` if the operation was successful.
     *
     * @throws {LocalSaveError} Will reject the promise if an error occurs during the deletion process.
     */
    async destroy() {
        return new Promise<true>((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(this.dbName);
            deleteRequest.onsuccess = () => {
                if (this.printLogs) {
                    Logger.debug(`Database deleted successfully`, {
                        dbName: this.dbName,
                        version: deleteRequest.result,
                    });
                }
                resolve(true);
            };
            deleteRequest.onerror = () => {
                if (this.printLogs) {
                    Logger.error(`Error deleting database [dbName:${this.dbName}]`);
                }
                reject(new LocalSaveError(deleteRequest.error?.message ?? 'Error deleting database'));
            };
        });
    }
}
export type DBName = string;
export type EncryptionKey = string;
export type Category = string;
export interface DBItem {
    timestamp: number;
    data: unknown;
}
export type DBItemEncryptedBase64 = string;

export interface Config {
    /**
     * The name of the database to use for local save
     *
     * @default "LocalSave"
     */
    dbName?: DBName;
    /**
     * The key to use for encrypting and decrypting data
     * Not providing this will store data in plain text
     * Should be a string without spaces of length 16, 24, or 32 characters
     *
     * @default undefined
     */
    encryptionKey?: EncryptionKey;
    /**
     * The categories to use for storing data
     * You can use these to separate different types of data
     * No spaces are allowed in the key
     *
     * @default ["userData"]
     */
    categories?: Category[];
    /**
     * The number of days to use as the threshold for expiring data
     *
     * @default '30' days
     */
    expiryThreshold?: number;
    /**
     * Whether to clear all data for a category if an error occurs while decrypting data
     * Most likely reason of error is due to an incorrect encryption key
     *
     * @default true
     */
    clearOnDecryptError?: boolean;
    /**
     * Whether to print logs
     * Includes debug and errors logs
     *
     * @default false
     */
    printLogs?: boolean;
}
export default LocalSave;

import LocalSaveConfigError from '@local-save/utils/errors/LocalSaveConfigError';
import LocalSaveEncryptionKeyError from '@local-save/utils/errors/LocalSaveEncryptionKeyError';
import LocalSaveError from '@local-save/utils/errors/LocalSaveError';
import Logger from '@local-save/utils/logger';
import {
    arrayBufferToBase64,
    base64ToArrayBuffer,
    isEncryptionKeyDefined,
    isValidEncryptionKey,
} from '@local-save/utils/utils';

class LocalSave {
    dbName: DBName = 'LocalSave';
    encryptionKey?: EncryptionKey;
    private cachedCryptoKeyPromise?: Promise<CryptoKey>;
    private cachedCryptoKeySource?: EncryptionKey;
    categories: Category[] = ['userData'];
    expiryThreshold: PositiveNumber = 30;
    blockedTimeoutThreshold: PositiveNumber = 10 * 1000;
    clearOnDecryptError: boolean = true;
    printLogs: boolean = false;
    constructor(config?: Config) {
        this.dbName = config?.dbName ?? this.dbName;
        this.encryptionKey = config?.encryptionKey;
        this.categories = config?.categories ?? this.categories;
        this.clearOnDecryptError = config?.clearOnDecryptError ?? this.clearOnDecryptError;
        this.expiryThreshold = config?.expiryThreshold ?? this.expiryThreshold;
        this.blockedTimeoutThreshold = config?.blockedTimeoutThreshold ?? this.blockedTimeoutThreshold;
        this.printLogs = config?.printLogs ?? this.printLogs;

        if (!!config?.encryptionKey && !isValidEncryptionKey(config?.encryptionKey)) {
            throw new LocalSaveConfigError('Encryption key should be of length 16, 24, or 32 characters');
        } else if (
            typeof this.expiryThreshold !== 'number' ||
            !Number.isFinite(this.expiryThreshold) ||
            this.expiryThreshold <= 0
        ) {
            throw new LocalSaveConfigError('expiryThreshold should be a positive number');
        } else if (
            typeof this.blockedTimeoutThreshold !== 'number' ||
            !Number.isFinite(this.blockedTimeoutThreshold) ||
            this.blockedTimeoutThreshold <= 0
        ) {
            throw new LocalSaveConfigError('blockedTimeoutThreshold should be a positive number');
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
            let settled = false;
            let blockedTimeout: ReturnType<typeof setTimeout> | undefined;

            const settleResolve = (db: IDBDatabase) => {
                if (settled) {
                    db.close();
                    return;
                }
                settled = true;
                if (blockedTimeout) {
                    clearTimeout(blockedTimeout);
                }
                resolve(db);
            };

            const settleReject = (error: LocalSaveError) => {
                if (settled) return;
                settled = true;
                if (blockedTimeout) {
                    clearTimeout(blockedTimeout);
                }
                reject(error);
            };

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
                const db = openRequest.result;
                db.onversionchange = () => {
                    if (this.printLogs) {
                        Logger.warn(`Closing stale database connection on version change [dbName:${this.dbName}]`);
                    }
                    db.close();
                };
                if (this.printLogs) {
                    Logger.debug(`Database opened successfully`, {
                        dbName: this.dbName,
                        version: db.version,
                    });
                }
                settleResolve(db);
            };
            openRequest.onerror = () => {
                if (this.printLogs) {
                    Logger.error(`LocalSaveError opening database [dbName:${this.dbName}]`, openRequest.error);
                }
                settleReject(new LocalSaveError(openRequest.error?.message ?? 'Error opening database'));
            };
            openRequest.onblocked = () => {
                if (this.printLogs) {
                    Logger.warn(
                        `Opening database is currently blocked by an existing open connection. Waiting for ${this.blockedTimeoutThreshold} ms before timing out [dbName:${this.dbName}]`,
                    );
                }
                if (blockedTimeout || settled) return;
                blockedTimeout = setTimeout(() => {
                    settleReject(
                        new LocalSaveError(
                            `Opening database timed out after ${this.blockedTimeoutThreshold} ms because it is blocked by open connections`,
                        ),
                    );
                }, this.blockedTimeoutThreshold);
            };
        });
    }

    /**
     * Lists all object stores currently available in the configured database.
     *
     * @internal
     *
     * @returns A promise that resolves to an array of object store names.
     */
    private async listStores() {
        const db = await this.openDB();
        try {
            const stores = Array.from(db.objectStoreNames);
            if (this.printLogs) {
                Logger.debug(`Object stores listed successfully`, {
                    stores,
                });
            }
            return stores;
        } finally {
            db.close();
        }
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
            const dbVersion = db.version;
            db.close();
            throw new LocalSaveError(
                `Requested object store not found in current database version [category:${category} / dbName:${this.dbName} / version:${dbVersion}].`,
            );
        }
        let transaction: IDBTransaction;
        try {
            transaction = db.transaction(category, mode);
        } catch (error) {
            db.close();
            throw new LocalSaveError(error instanceof Error ? error.message : 'Error creating transaction');
        }
        transaction.oncomplete = () => {
            db.close();
        };
        transaction.onerror = () => {
            db.close();
        };
        transaction.onabort = () => {
            db.close();
        };
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
        const sourceKey = this.encryptionKey;
        if (!isEncryptionKeyDefined(sourceKey)) {
            throw new LocalSaveEncryptionKeyError(`Encryption key is not configured`);
        }
        if (!isValidEncryptionKey(sourceKey)) {
            throw new LocalSaveEncryptionKeyError('Encryption key should be of length 16, 24, or 32 characters');
        }
        if (this.cachedCryptoKeyPromise && this.cachedCryptoKeySource === sourceKey) {
            return this.cachedCryptoKeyPromise;
        }
        const encoder = new TextEncoder();
        const keyBytes = encoder.encode(sourceKey);
        const importPromise = crypto.subtle
            .importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
            .then((key) => {
                if (this.printLogs) {
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
        if (this.printLogs) {
            Logger.debug(`set() called to store data with following props`, {
                category,
                itemKey,
            });
        }
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
        if (this.printLogs) {
            Logger.debug(`get() called to retrieve data with following props`, {
                category,
                itemKey,
            });
        }
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
                return resolve(result);
            };
            getRequest.onerror = () => {
                return reject(new LocalSaveError(getRequest.error?.message ?? 'Error getting data'));
            };
        });
    }

    /**
     * Lists all categories (object stores) currently available in the database.
     *
     * @returns A promise that resolves to an array of category names.
     */
    async listCategories(): Promise<Category[]> {
        if (this.printLogs) {
            Logger.debug(`listCategories() called to list all categories`);
        }
        return await this.listStores();
    }

    /**
     * Lists all item keys stored under the specified category.
     *
     * @param category The category from which item keys should be listed.
     *
     * @returns A promise that resolves to an array of item keys.
     *
     * @throws {LocalSaveError} Will reject the promise if an error occurs while listing keys.
     */
    async listKeys(category: Category) {
        if (this.printLogs) {
            Logger.debug(`listKeys() called to list all keys for category`, {
                category,
            });
        }
        const store = await this.getStore(category);
        const db = store.transaction.db;
        try {
            return await new Promise<string[]>((resolve, reject) => {
                const keysRequest = store.getAllKeys();
                keysRequest.onsuccess = () => {
                    const keys = keysRequest.result as string[];
                    if (this.printLogs) {
                        Logger.debug(`Keys listed successfully for category`, {
                            category,
                            keys,
                        });
                    }
                    resolve(keys);
                };
                keysRequest.onerror = () => {
                    if (this.printLogs) {
                        Logger.error(`Error listing keys for category [category:${category}]`, keysRequest.error);
                    }
                    reject(new LocalSaveError(keysRequest.error?.message ?? 'Error listing keys'));
                };
            });
        } finally {
            db.close();
        }
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
        if (this.printLogs) {
            Logger.debug(`remove() called to remove data with following props`, {
                category,
                itemKey,
            });
        }
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
        if (this.printLogs) {
            Logger.debug(`clear() called to store all data under '${category}' category`);
        }
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
        if (this.printLogs) {
            Logger.debug(`expire() called to expire data older than ${days} days`);
        }
        if (typeof days !== 'number' || !Number.isFinite(days) || days <= 0) {
            throw new LocalSaveError('days should be a positive number');
        }
        const checkDate = Date.now() - days * 86400000;
        for (const category of this.categories) {
            const store = await this.getStore(category);
            try {
                const entries = await new Promise<Array<{ key: IDBValidKey; value: DBItemEncryptedBase64 | DBItem }>>(
                    (resolve, reject) => {
                        const cursorRequest = store.openCursor();
                        const collectedEntries: Array<{ key: IDBValidKey; value: DBItemEncryptedBase64 | DBItem }> = [];
                        cursorRequest.onsuccess = () => {
                            const cursor = cursorRequest.result;
                            if (!cursor) {
                                if (this.printLogs) {
                                    Logger.debug(`Entries scanned successfully for expiring data`, {
                                        category,
                                        entryCount: collectedEntries.length,
                                    });
                                }
                                resolve(collectedEntries);
                                return;
                            }
                            collectedEntries.push({
                                key: cursor.key,
                                value: cursor.value as DBItemEncryptedBase64 | DBItem,
                            });
                            cursor.continue();
                        };
                        cursorRequest.onerror = () => {
                            if (this.printLogs) {
                                Logger.error(
                                    `LocalSaveError scanning entries for expiring data [category:${category}]`,
                                    cursorRequest.error,
                                );
                            }
                            reject(new LocalSaveError(cursorRequest.error?.message ?? 'Error scanning entries'));
                        };
                    },
                );

                const keysToDelete: string[] = [];
                for (const entry of entries) {
                    if (typeof entry.key !== 'string') continue;

                    let item: DBItem;
                    if (typeof entry.value === 'string') {
                        try {
                            item = await this.decryptData(entry.value);
                        } catch (error) {
                            if (this.printLogs) {
                                Logger.error(`Failed to decrypt data while expiring`, error);
                            }
                            if (this.clearOnDecryptError) {
                                if (this.printLogs) {
                                    Logger.error(
                                        `Triggering clear for all data for category since decryption failed during expire`,
                                    );
                                }
                                void this.clear(category);
                            }
                            throw new LocalSaveError(error instanceof Error ? error.message : 'Failed to decrypt data');
                        }
                    } else {
                        item = entry.value;
                    }

                    if (item.timestamp < checkDate) {
                        keysToDelete.push(entry.key);
                    }
                }

                if (keysToDelete.length === 0) {
                    continue;
                }

                const writeStore = await this.getStore(category, 'readwrite');
                await new Promise<void>((resolve, reject) => {
                    let pending = keysToDelete.length;
                    let settled = false;

                    const settleReject = (error: LocalSaveError) => {
                        if (settled) return;
                        settled = true;
                        reject(error);
                    };

                    for (const key of keysToDelete) {
                        const deleteRequest = writeStore.delete(key);
                        deleteRequest.onsuccess = () => {
                            if (settled) return;
                            pending -= 1;
                            if (pending === 0) {
                                if (this.printLogs) {
                                    Logger.debug(`Expired data removed successfully`, {
                                        category,
                                        removedCount: keysToDelete.length,
                                    });
                                }
                                resolve();
                            }
                        };
                        deleteRequest.onerror = () => {
                            if (this.printLogs) {
                                Logger.error(
                                    `LocalSaveError removing expired data [category:${category} / key:${key}]`,
                                    deleteRequest.error,
                                );
                            }
                            settleReject(
                                new LocalSaveError(deleteRequest.error?.message ?? 'Error removing expired data'),
                            );
                        };
                    }
                });
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
        if (this.printLogs) {
            Logger.debug(`destroy() called to wipe all data under all categories`);
        }
        return new Promise<true>((resolve, reject) => {
            const deleteRequest = indexedDB.deleteDatabase(this.dbName);
            let settled = false;
            let blockedTimeout: ReturnType<typeof setTimeout> | undefined;

            const settleResolve = () => {
                if (settled) return;
                settled = true;
                if (blockedTimeout) {
                    clearTimeout(blockedTimeout);
                }
                resolve(true);
            };

            const settleReject = (error: LocalSaveError) => {
                if (settled) return;
                settled = true;
                if (blockedTimeout) {
                    clearTimeout(blockedTimeout);
                }
                reject(error);
            };

            deleteRequest.onsuccess = () => {
                if (this.printLogs) {
                    Logger.debug(`Database deleted successfully`, {
                        dbName: this.dbName,
                    });
                }
                settleResolve();
            };
            deleteRequest.onerror = () => {
                if (this.printLogs) {
                    Logger.error(`Error deleting database [dbName:${this.dbName}]`);
                }
                settleReject(new LocalSaveError(deleteRequest.error?.message ?? 'Error deleting database'));
            };
            deleteRequest.onblocked = () => {
                if (this.printLogs) {
                    Logger.warn(
                        `Deleting database is currently blocked by an open connection. Waiting for ${this.blockedTimeoutThreshold} ms before timing out [dbName:${this.dbName}]`,
                    );
                }
                if (blockedTimeout || settled) return;
                blockedTimeout = setTimeout(() => {
                    settleReject(
                        new LocalSaveError(
                            `Deleting database timed out after ${this.blockedTimeoutThreshold} ms because it is blocked by open connections`,
                        ),
                    );
                }, this.blockedTimeoutThreshold);
            };
        });
    }
}
export type DBName = string;
export type EncryptionKey = string;
export type Category = string;
export type PositiveNumber = number;
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
     * @default 30
     */
    expiryThreshold?: PositiveNumber;
    /**
     * The time in milliseconds to wait before failing blocked IndexedDB open/delete requests.
     *
     * @default 10000
     */
    blockedTimeoutThreshold?: PositiveNumber;
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

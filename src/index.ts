import CryptoJS from "crypto-js";

class LocalSave {
	dbName: DBName = "LocalSave";
	encryptKey?: EncryptKey;
	categories: Category[] = ["userData"];
	expiryThreshold: number = 30;
	clearOnDecryptError: Boolean = true;
	printLogs: Boolean = false;
	constructor(config: Config) {
		this.dbName = config?.dbName ?? this.dbName;
		this.encryptKey = config?.encryptKey;
		this.categories = config?.categories ?? this.categories;
		this.expiryThreshold = config?.expiryThreshold ?? this.expiryThreshold;
		this.clearOnDecryptError = config?.clearOnDecryptError ?? this.clearOnDecryptError;
		this.printLogs = config?.printLogs ?? this.printLogs;
	}

	/**
	 * Opens a connection to the IndexedDB database.
	 * It handles the database versioning and ensures that the required object stores are created if they do not exist.
	 *
	 * @internal
	 * @param version - The version of the database to open. Optional.
	 * @returns {Promise<IDBDatabase>} A promise that resolves to the opened `IDBDatabase` instance.
	 */
	private openDB(version?: number): Promise<IDBDatabase> {
		return new Promise<IDBDatabase>((resolve, reject) => {
			const openRequest = indexedDB.open(this.dbName, version);
			openRequest.onupgradeneeded = () => {
				const db = openRequest.result;
				if (this.printLogs) {
					console.debug(`LocalSave | Database upgrade triggered for [dbName:${this.dbName} / version:${db.version}]`);
				}
				for (const category of this.categories) {
					if (!db.objectStoreNames.contains(category)) {
						if (this.printLogs) {
							console.debug(`LocalSave | Creating object store for [category:${category}]`);
						}
						db.createObjectStore(category);
					}
				}
			};
			openRequest.onsuccess = () => {
				if (this.printLogs) {
					console.debug(
						`LocalSave | Database opened successfully [dbName:${this.dbName} / version:${openRequest.result.version}]`
					);
				}
				return resolve(openRequest.result);
			};
			openRequest.onerror = () => {
				if (this.printLogs) {
					console.error(`LocalSave | Error opening database [dbName:${this.dbName}]`, openRequest.error);
				}
				return reject(openRequest.error);
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
	 * @param category - The name of the object store to retrieve.
	 * @param mode - The mode for the transaction (default is "readonly").
	 * @returns {Promise<IDBObjectStore>} A promise that resolves to the requested object store.
	 * @throws Will throw an error if the object store does not exist in the database and the category is invalid
	 */
	private async getStore(category: Category, mode: IDBTransactionMode = "readonly"): Promise<IDBObjectStore> {
		let db = await this.openDB();
		if (!db.objectStoreNames.contains(category) && this.categories.includes(category)) {
			if (this.printLogs) {
				console.debug(
					`LocalSave | Requested object store not found in current database version [category:${category} / dbName:${this.dbName} / version:${db.version}].\nTriggering database upgrade to create object store.`
				);
			}
			const currVersion = db.version;
			db.close();
			db = await this.openDB(currVersion + 1);
		} else if (!db.objectStoreNames.contains(category)) {
			throw new Error(
				`LocalSave | Requested object store not found in current database version [category:${category} / dbName:${this.dbName} / version:${db.version}].`
			);
		}
		const transaction = db.transaction(category, mode);
		const store = transaction.objectStore(category);
		if (this.printLogs) {
			console.debug(
				`LocalSave | Object store retrieved from database [category:${category} / mode:${mode} / dbName:${this.dbName} / version:${db.version}]`
			);
		}
		return store;
	}

	/**
	 * Encrypts the provided data using AES encryption.
	 *
	 * @internal
	 * @param data - The data to be encrypted. It can be a CryptoJS.lib.WordArray or a string.
	 * @returns {OperationReturnData} An object containing the result of the encryption process:
	 * - `success`: A boolean indicating whether the encryption was successful.
	 * - `data`: The encrypted data as a string, if the encryption was successful.
	 * - `error`: An Error object, if the encryption failed.
	 */
	private encryptData(data: CryptoJS.lib.WordArray | string): OperationReturnData {
		try {
			if (!this.encryptKey) {
				return { success: true, data };
			}
			return { success: true, data: CryptoJS.AES.encrypt(data, this.encryptKey).toString() };
		} catch (error) {
			if (this.printLogs) {
				console.error("LocalSave | Failed to encrypt data", error);
			}
			return { success: false, error };
		}
	}
	/**
	 * Decrypts the provided data using the configured encryption key.
	 * If no encryption key is configured, it returns the data as is.
	 *
	 * @param data - The data to decrypt, as a string or CryptoJS.lib.CipherParams.
	 * @returns {OperationReturnData} An object containing the result of the decryption process:
	 * - `success`: A boolean indicating whether the decryption was successful.
	 * - `data`: The decrypted data as a string, if the decryption was successful.
	 * - `error`: An Error object, if the decryption failed.
	 */
	decryptData(data: CryptoJS.lib.CipherParams | string): {
		success: boolean;
		data?: CryptoJS.lib.CipherParams | string;
		error?: Error | unknown;
	} {
		try {
			if (!this.encryptKey) {
				return { success: true, data };
			}
			const decryptedBytes = CryptoJS.AES.decrypt(data, this.encryptKey);
			return { success: true, data: decryptedBytes.toString(CryptoJS.enc.Utf8) };
		} catch (error) {
			if (this.printLogs) {
				console.error("LocalSave | Failed to decrypt data", error);
			}
			return {
				success: false,
				error,
			};
		}
	}

	/**
	 * Stores data in the specified category with the given item key.
	 * If encryption key is configured, the data is encrypted first before being stored.
	 *
	 * @param category - The category under which the data should be stored.
	 * @param itemKey - The key to identify the stored data.
	 * @param data - The data to be stored.
	 * @returns {Promise<OperationReturnData>} A promise that resolves to an object with the following properties:
	 * - `success`: A boolean indicating whether the operation was successful.
	 * - `error`: An Error object, if the operation failed.
	 */
	async set(
		category: Category,
		itemKey: IDBValidKey,
		data: unknown
	): Promise<{
		success: boolean;
		error?: Error | unknown;
	}> {
		const payload = {
			timestamp: Date.now(),
			data,
		};
		return new Promise<OperationReturnData>(async (resolve, reject) => {
			this.getStore(category, "readwrite").then((store) => {
				let finalPayload: DBItem | DBItemEncrypted = payload;
				if (this.encryptKey) {
					const encryptedPayload = this.encryptData(JSON.stringify(payload));
					if (!encryptedPayload.success) {
						return reject(encryptedPayload);
					}
					finalPayload = encryptedPayload.data as DBItemEncrypted;
				}
				const putRequest = store.put(finalPayload, itemKey);
				putRequest.onsuccess = () => {
					return resolve({ success: true });
				};
				putRequest.onerror = () => {
					return reject({ success: false, error: putRequest.error });
				};
			});
		});
	}

	/**
	 * Retrieves an item from the specified category in the IndexedDB.
	 * If the item is not found, the promise resolves to `null`.
	 * The item is decrypted if an encryption key is configured.
	 * If an error occurs during the retrieval process, the promise is rejected. In this case, all data for the category is cleared.
	 *
	 * @param category - The category from which to retrieve the item.
	 * @param itemKey - The key of the item to retrieve.
	 * @returns {Promise<DBItem | null>}  A promise that resolves to the retrieved item or null if not found.
	 *
	 * @throws Will reject the promise if an error occurs during the retrieval process.
	 */
	get(category: Category, itemKey: IDBValidKey): Promise<DBItem | null> {
		return new Promise<DBItem | null>(async (resolve, reject) => {
			this.getStore(category).then((store) => {
				const getRequest = store.get(itemKey);
				getRequest.onsuccess = () => {
					const result = getRequest.result;
					if (!result) {
						return resolve(null);
					} else {
						if (this.encryptKey) {
							const decryptedData: OperationReturnData = this.decryptData(result);
							if (!decryptedData.success) {
								if (this.clearOnDecryptError) {
									if (this.printLogs) {
										console.error(`LocalSave | Error decrypting data. Clearing [category:${category}]`);
									}
									this.clear(category);
								}
								return reject(null);
							} else {
								return resolve(JSON.parse(decryptedData.data as string) as DBItem);
							}
						} else {
							return resolve(result as DBItem);
						}
					}
				};
				getRequest.onerror = () => {
					return reject(getRequest.error);
				};
			});
		});
	}

	/**
	 * Removes an entry from the specified category and the specific itemKey in the IndexedDB store.
	 *
	 * @param {Category} category - The category from which the item should be removed.
	 * @param {IDBValidKey} itemKey - The key of the item to be removed.
	 * @returns {Promise<OperationReturnData>} A promise that resolves to an object with the following properties:
	 * - `success`: A boolean indicating whether the operation was successful.
	 * - `error`: An Error object, if the operation failed.
	 */
	async remove(category: Category, itemKey: IDBValidKey): Promise<OperationReturnData> {
		return new Promise((resolve, reject) => {
			this.getStore(category, "readwrite").then((store) => {
				const deleteRequest = store.delete(itemKey);
				deleteRequest.onsuccess = () => {
					return resolve({ success: true });
				};
				deleteRequest.onerror = () => {
					return reject({ success: false, error: deleteRequest.error });
				};
			});
		});
	}

	/**
	 * Clears all entries in the specified category.
	 *
	 * @param category - The category to clear.
	 * @returns {Promise<OperationReturnData>} A promise that resolves to an object with the following properties:
	 * - `success`: A boolean indicating whether the operation was successful.
	 * - `error`: An Error object, if the operation failed.
	 */
	async clear(category: Category): Promise<OperationReturnData> {
		return new Promise((resolve, reject) => {
			this.getStore(category, "readwrite").then((store) => {
				const clearRequest = store.clear();
				clearRequest.onsuccess = () => {
					return resolve({ success: true });
				};
				clearRequest.onerror = () => {
					return reject({ success: false, error: clearRequest.error });
				};
			});
		});
	}

	/**
	 * Expires data older than the specified number of days.
	 *
	 * This method iterates through all categories and removes items that have a timestamp
	 * older than the specified number of days from the current date.
	 *
	 * @param {number} [days=this.expiryThreshold] - The number of days to use as the threshold for expiring data.
	 * Defaults to expiryThreshold from config if not provided.
	 * @returns {Promise<OperationReturnData>} A promise that resolves to an object with the following properties:
	 * - `success`: A boolean indicating whether the operation was successful.
	 * - `error`: An Error object, if the operation failed.
	 *
	 * @throws {Error} - Throws an error if there is an issue accessing the store or removing items.
	 */
	async expire(days: number = this.expiryThreshold): Promise<OperationReturnData> {
		const checkDate = Date.now() - days * 86400000;
		for (const category of this.categories) {
			const store = await this.getStore(category);
			try {
				const keys = await new Promise<IDBValidKey[]>((resolve, reject) => {
					const keysRequest = store.getAllKeys();
					keysRequest.onsuccess = () => {
						resolve(keysRequest.result);
					};
					keysRequest.onerror = () => {
						reject(keysRequest.error);
					};
				});
				for (const key of keys) {
					const item = await this.get(category, key);
					if (item && item.timestamp < checkDate) {
						await this.remove(category, key);
					}
				}
			} catch (error) {
				if (this.printLogs) {
					console.error(`Error expiring data older than '${days}' days`, error);
				}
				return { success: false, error };
			}
		}
		return { success: true };
	}

	/**
	 * Asynchronously destroys the database by deleting it from IndexedDB.
	 *
	 * @returns {Promise<OperationReturnData>} A promise that resolves to an object with the following properties:
	 * - `success`: A boolean indicating whether the operation was successful.
	 * - `error`: An Error object, if the operation failed.
	 */
	async destroy(): Promise<OperationReturnData> {
		return new Promise<OperationReturnData>((resolve, reject) => {
			const deleteRequest = indexedDB.deleteDatabase(this.dbName);
			deleteRequest.onsuccess = () => resolve({ success: true });
			deleteRequest.onerror = () =>
				reject({
					success: false,
					error: deleteRequest.error,
				});
		});
	}
}
export type DBName = string;
export type EncryptKey = CryptoJS.lib.WordArray | string;
export type Category = string;
export type DBItem = {
	timestamp: number;
	data: unknown;
};
export type DBItemEncrypted = CryptoJS.lib.WordArray | string;
export interface OperationReturnData {
	/**
	 * If the operation was successful
	 */
	success: boolean;
	/**
	 * If the operation was successful, the data if any
	 */
	data?: unknown;
	/**
	 * If the operation failed, the error
	 */
	error?: Error | unknown;
}
export interface Config {
	/**
	 * The name of the database to use for local save
	 *
	 * @default "LocalSave"
	 */
	dbName: DBName;
	/**
	 * The key to use for encrypting and decrypting data
	 * Not providing this will store data in plain text
	 * No spaces are allowed in the key
	 *
	 * @default undefined
	 */
	encryptKey?: EncryptKey;
	/**
	 * The categories to use for storing data
	 * You can use these to separate different types of data
	 * No spaces are allowed in the key
	 *
	 * @default ["userData"]
	 */
	categories: Category[];
	/**
	 * The number of days to use as the threshold for expiring data
	 *
	 * @default 30
	 */
	expiryThreshold: number;
	/**
	 * Whether to clear all data for a category if an error occurs while decrypting data
	 * Most likely reason of error is due to an incorrect encryption key
	 *
	 * @default true
	 */
	clearOnDecryptError: Boolean;
	/**
	 * Whether to print logs
	 * Includes debug and errors logs
	 *
	 * @default false
	 */
	printLogs: Boolean;
}
export default LocalSave;

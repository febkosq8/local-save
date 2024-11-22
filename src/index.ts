import CryptoJS from "crypto-js";

class LocalSave {
	dbName: DBName = "LocalSave";
	encryptKey?: EncryptKey;
	categories: Category[] = ["userData"];
	expiryThreshold: number = 30;
	printDebug: Boolean = false;
	constructor(config: Config) {
		this.dbName = config?.dbName ?? this.dbName;
		this.encryptKey = config?.encryptKey;
		this.categories = config?.categories ?? this.categories;
		this.expiryThreshold = config?.expiryThreshold ?? this.expiryThreshold;
		this.printDebug = config?.printDebug ?? this.printDebug;
	}

	/**
	 * Opens a connection to the IndexedDB database.
	 * It handles the database versioning and ensures that the required object stores are created if they do not exist.
	 *
	 * @internal
	 * @returns {Promise<IDBDatabase>} A promise that resolves to the opened `IDBDatabase` instance.
	 */
	private openDB(): Promise<IDBDatabase> {
		return new Promise<IDBDatabase>((resolve, reject) => {
			const openRequest = indexedDB.open(this.dbName, 1);
			openRequest.onupgradeneeded = () => {
				const db = openRequest.result;
				for (const category of this.categories) {
					if (!db.objectStoreNames.contains(category)) {
						db.createObjectStore(category);
					}
				}
			};
			openRequest.onsuccess = () => {
				resolve(openRequest.result);
			};
			openRequest.onerror = () => {
				reject(openRequest.error);
			};
		});
	}

	/**
	 * Retrieves an object store from the IndexedDB database.
	 * It handles the transaction mode and ensures that the requested object store is returned.
	 *
	 * @internal
	 * @param category - The name of the object store to retrieve.
	 * @param mode - The mode for the transaction (default is "readonly").
	 * @returns {Promise<IDBObjectStore>} A promise that resolves to the requested object store.
	 */
	private async getStore(category: Category, mode: IDBTransactionMode = "readonly"): Promise<IDBObjectStore> {
		const db = await this.openDB();
		const transaction = db.transaction(category, mode);
		return transaction.objectStore(category);
	}

	/**
	 * Encrypts the provided data using the configured encryption key.
	 * If no encryption key is configured, it returns the data as is.
	 *
	 * @internal
	 * @param data - The data to encrypt, as a string.
	 * @returns {string | CryptoJS.lib.WordArray} The encrypted data as a string, or the original data if no encryption key is configured.
	 */
	private encryptData(data: CryptoJS.lib.WordArray | string): string | CryptoJS.lib.WordArray {
		if (!this.encryptKey) {
			return data;
		}
		return CryptoJS.AES.encrypt(data, this.encryptKey).toString();
	}
	/**
	 * Decrypts the provided data using the configured encryption key.
	 * If no encryption key is configured, it returns the data as is.
	 *
	 * @internal
	 * @param data - The data to decrypt, as a string or CryptoJS.lib.CipherParams.
	 * @returns {string | null} The decrypted data as a string, or null if decryption fails.
	 */
	private decryptData(data: CryptoJS.lib.CipherParams | string): string | null {
		try {
			if (!this.encryptKey) {
				return data as string;
			}
			const decryptedBytes = CryptoJS.AES.decrypt(data, this.encryptKey);
			return decryptedBytes.toString(CryptoJS.enc.Utf8);
		} catch (e) {
			if (this.printDebug) {
				console.error("Error while decrypting data", e);
			}
			return null;
		}
	}

	/**
	 * Stores data in the specified category with the given item key.
	 * If encryption key is configured, the data is encrypted first before being stored.
	 *
	 * @param category - The category under which the data should be stored.
	 * @param itemKey - The key to identify the stored data.
	 * @param data - The data to be stored.
	 * @returns {Promise<true>} A promise that resolves to true if the data is successfully stored, or rejects with an error if the operation fails.
	 */
	async set(category: Category, itemKey: IDBValidKey, data: unknown): Promise<true> {
		const payload = {
			timestamp: Date.now(),
			data,
		};
		return new Promise<true>(async (resolve, reject) => {
			this.getStore(category, "readwrite").then((store) => {
				const encryptedData = this.encryptKey ? this.encryptData(JSON.stringify(payload)) : payload;
				const putRequest = store.put(encryptedData, itemKey);
				putRequest.onsuccess = () => {
					resolve(true);
				};
				putRequest.onerror = () => {
					reject(putRequest.error);
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
					try {
						if (!getRequest.result) {
							resolve(null);
						} else {
							const decryptedData = this.encryptKey ? this.decryptData(getRequest.result) : getRequest.result;
							if (!decryptedData) {
								resolve(null);
							} else {
								resolve((this.encryptKey ? JSON.parse(decryptedData) : decryptedData) as DBItem);
							}
						}
					} catch (e) {
						if (this.printDebug) {
							console.error(
								`Error while fetching data for '${itemKey}' from '${category}'.\nClearing all data for '${category}'`,
								e
							);
						}
						store.clear();
						reject(e);
					}
				};
				getRequest.onerror = () => {
					reject(getRequest.error);
				};
			});
		});
	}

	/**
	 * Removes an entry from the specified category and the specific itemKey in the IndexedDB store.
	 *
	 * @param {Category} category - The category from which the item should be removed.
	 * @param {IDBValidKey} itemKey - The key of the item to be removed.
	 * @returns {Promise<boolean>} A promise that resolves to `true` if the item was successfully removed, or rejects with an error if the removal failed.
	 */
	async remove(category: Category, itemKey: IDBValidKey): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.getStore(category, "readwrite").then((store) => {
				const deleteRequest = store.delete(itemKey);
				deleteRequest.onsuccess = () => {
					resolve(true);
				};
				deleteRequest.onerror = () => {
					reject(deleteRequest.error);
				};
			});
		});
	}

	/**
	 * Clears all entries in the specified category.
	 *
	 * @param category - The category to clear.
	 * @returns {Promise<boolean>} A promise that resolves to `true` if the operation is successful, or rejects with an error if it fails.
	 */
	async clear(category: Category): Promise<boolean> {
		return new Promise((resolve, reject) => {
			this.getStore(category, "readwrite").then((store) => {
				const clearRequest = store.clear();
				clearRequest.onsuccess = () => {
					resolve(true);
				};
				clearRequest.onerror = () => {
					reject(clearRequest.error);
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
	 * @param {number} [days=30] - The number of days to use as the threshold for expiring data.
	 *                             Defaults to expiryThreshold from config if not provided.
	 * @returns {Promise<void>} - A promise that resolves when the expiration process is complete.
	 *
	 * @throws {Error} - Throws an error if there is an issue accessing the store or removing items.
	 */
	async expire(days: number = this.expiryThreshold): Promise<void> {
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
			} catch (e) {
				if (this.printDebug) {
					console.error(`Error expiring data older than '${days}' days`, e);
				}
			}
		}
	}

	/**
	 * Asynchronously destroys the database by deleting it from IndexedDB.
	 *
	 * @returns {Promise<Boolean>} A promise that resolves when the database is deleted.
	 */
	async destroy(): Promise<Boolean> {
		return new Promise<Boolean>((resolve, reject) => {
			const deleteRequest = indexedDB.deleteDatabase(this.dbName);
			deleteRequest.onsuccess = () => resolve(true);
			deleteRequest.onerror = () => reject(deleteRequest.error);
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
	 * If you provide this, make sure to set it before using any other functions
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
	expiryThreshold?: number;
	/**
	 * Whether to print debug logs
	 *
	 * @default false
	 */
	printDebug: Boolean;
}
export default LocalSave;

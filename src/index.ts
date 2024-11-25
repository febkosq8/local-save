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
	 *
	 * @param category - The name of the object store to retrieve.
	 * @param mode - The mode for the transaction (default is "readonly").
	 *
	 * @returns A promise that resolves to the requested object store.
	 *
	 * @throws {Error} Will throw an error if the object store does not exist in the database and the category is invalid
	 */
	private async getStore(category: Category, mode: IDBTransactionMode = "readonly") {
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
	 * Converts an ArrayBuffer to a Base64 encoded string.
	 *
	 * @internal
	 *
	 * @param ArrayBuffer - The ArrayBuffer to convert.
	 *
	 * @returns The Base64 encoded string representation of the ArrayBuffer.
	 */
	private arrayBufferToBase64(buffer: ArrayBuffer) {
		let binary = "";
		const bytes = new Uint8Array(buffer);
		const len = bytes.byteLength;
		for (let i = 0; i < len; i++) {
			binary += String.fromCharCode(bytes[i]);
		}
		return window.btoa(binary) as string;
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
	private base64ToArrayBuffer(base64: string) {
		const binary_string = window.atob(base64);
		const len = binary_string.length;
		const bytes = new Uint8Array(len);
		for (let i = 0; i < len; i++) {
			bytes[i] = binary_string.charCodeAt(i);
		}
		return bytes.buffer as ArrayBuffer;
	}

	/**
	 * Retrieves the encryption key as a CryptoKey object.
	 *
	 * @internal
	 * @returns A promise that resolves to a CryptoKey object.
	 *
	 * @throws {Error} If the encryption key is not configured.
	 * @throws {Error} If the encryption key length is not 16, 24, or 32 characters.
	 */
	private async getEncryptKey() {
		if (!this.encryptKey) {
			throw new Error(`LocalSave | Encryption key is not configured`);
		} else if (![16, 24, 32].includes(this.encryptKey.length)) {
			throw new Error("LocalSave | Encryption key should be of length 16, 24, or 32 characters");
		}
		const encoder = new TextEncoder();
		const keyBytes = encoder.encode(this.encryptKey);
		return await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
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
	 * @throws {Error} If the encryption key is not configured.
	 * @throws {Error} If the encryption process fails.
	 */
	private async encryptData(data: DBItem) {
		try {
			if (!this.encryptKey) {
				throw new Error(`LocalSave | Encryption key is not configured`);
			}
			const iv = window.crypto.getRandomValues(new Uint8Array(12));
			const generatedKey = await this.getEncryptKey();
			const dataBuffer = new TextEncoder().encode(JSON.stringify(data));
			const encryptedData = await window.crypto.subtle.encrypt(
				{
					name: "AES-GCM",
					iv: iv,
				},
				generatedKey,
				dataBuffer
			);
			const ivUint8 = new Uint8Array(iv);
			const encryptedDataUint8 = new Uint8Array(encryptedData);
			const concatenatedArray = new Uint8Array(ivUint8.byteLength + encryptedDataUint8.byteLength);
			concatenatedArray.set(ivUint8, 0);
			concatenatedArray.set(encryptedDataUint8, ivUint8.byteLength);
			const base64Data = this.arrayBufferToBase64(concatenatedArray.buffer) as DBItemEncryptedBase64;
			if (this.printLogs) {
				console.debug(`LocalSave | Data encrypted successfully [base64DataLength:${base64Data.length}]`);
			}
			return base64Data;
		} catch (error) {
			if (this.printLogs) {
				console.error(`LocalSave | Data encryption failed`, error);
			}
			throw error;
		}
	}

	/**
	 * Decrypts the provided data using the configured encryption key.
	 * If no encryption key is configured, it returns the data as is.
	 *
	 * @param encryptedBase64Data The data to decrypt, as a string or CryptoJS.lib.CipherParams.
	 *
	 * @returns The decrypted data as an object.
	 *
	 * @throws {Error} If the encryption key is not configured.
	 * @throws {Error} If the decryption process fails.
	 */
	async decryptData(encryptedBase64Data: string) {
		try {
			if (!this.encryptKey) {
				throw new Error(`LocalSave | Encryption key is not configured`);
			}
			const arrayBuffer = this.base64ToArrayBuffer(encryptedBase64Data);
			const iv = new Uint8Array(arrayBuffer, 0, 12);
			const generatedKey = await this.getEncryptKey();
			const encryptedData = new Uint8Array(arrayBuffer, 12);
			const decryptedBufferData = await window.crypto.subtle.decrypt(
				{
					name: "AES-GCM",
					iv,
				},
				generatedKey,
				encryptedData
			);
			const decryptedData = JSON.parse(new TextDecoder().decode(decryptedBufferData)) as DBItem;
			if (this.printLogs) {
				console.debug(`LocalSave | Data decrypted successfully [timestamp:${decryptedData.timestamp}]`);
			}
			return decryptedData;
		} catch (error) {
			if (this.printLogs) {
				console.error(`LocalSave | Data decryption failed`, error);
			}
			throw error;
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
	 * @throws {Error} Will reject the promise if an error occurs during the saving process.
	 */
	async set(category: Category, itemKey: IDBValidKey, data: unknown) {
		let payload: DBItem | DBItemEncryptedBase64 = {
			timestamp: Date.now(),
			data,
		} as DBItem;
		try {
			if (this.encryptKey) {
				const encryptedPayload = await this.encryptData(payload);
				payload = encryptedPayload;
			}
			const store = await this.getStore(category, "readwrite");
			return new Promise<true>((resolve, reject) => {
				const putRequest = store.put(payload, itemKey);
				putRequest.onsuccess = () => {
					resolve(true);
				};
				putRequest.onerror = () => {
					reject(putRequest.error);
				};
			});
		} catch (error) {
			if (this.printLogs) {
				console.error(`LocalSave | Data storing failed`, error);
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
	 * @throws {Error} Will reject the promise if an error occurs while decrypting the data. Depending on the 'clearOnDecryptError' configuration, all data for the category can be cleared.
	 * @throws {Error} Will reject the promise if an error occurs during the retrieval process.
	 */
	async get(category: Category, itemKey: IDBValidKey) {
		const store = await this.getStore(category);
		return new Promise<DBItem | null>(async (resolve, reject) => {
			const getRequest = store.get(itemKey);
			getRequest.onsuccess = async () => {
				const result = getRequest.result as DBItemEncryptedBase64 | DBItem | null;
				if (!result) {
					return resolve(null);
				} else {
					if (this.encryptKey) {
						try {
							const decryptedData = await this.decryptData(result as DBItemEncryptedBase64);
							return resolve(decryptedData);
						} catch (error) {
							if (this.clearOnDecryptError) {
								if (this.printLogs) {
									console.error(`LocalSave | Failed to get data since decryption failed`, error);
								}
								this.clear(category);
								throw error;
							}
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
	}

	/**
	 * Removes an entry from the specified category and the specific itemKey in the IndexedDB store.
	 *
	 * @param category The category from which the item should be removed.
	 * @param itemKey The key of the item to be removed.
	 *
	 * @returns A promise that resolves to `true` if the operation was successful.
	 *
	 * @throws {Error} Will reject the promise if an error occurs during the removal process.
	 */
	async remove(category: Category, itemKey: IDBValidKey) {
		return new Promise<true>((resolve, reject) => {
			this.getStore(category, "readwrite").then((store) => {
				const deleteRequest = store.delete(itemKey);
				deleteRequest.onsuccess = () => {
					return resolve(true);
				};
				deleteRequest.onerror = () => {
					return reject(deleteRequest.error);
				};
			});
		});
	}

	/**
	 * Clears all entries in the specified category.
	 *
	 * @param category - The category to clear.
	 *
	 * @returns A promise that resolves to `true` if the operation was successful.
	 *
	 * @throws {Error} Will reject the promise if an error occurs during the clearing process.
	 */
	async clear(category: Category) {
		return new Promise<true>((resolve, reject) => {
			this.getStore(category, "readwrite").then((store) => {
				const clearRequest = store.clear();
				clearRequest.onsuccess = () => {
					return resolve(true);
				};
				clearRequest.onerror = () => {
					return reject(clearRequest.error);
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
	 * @param {number} [days=this.expiryThreshold] The number of days to use as the threshold for expiring data.
	 * Defaults to expiryThreshold from config if not provided.
	 *
	 * @returns A promise that resolves to `true` if the operation was successful.
	 *
	 * @throws {Error} - Throws an error if there is an issue accessing the store or removing items.
	 */
	async expire(days: number = this.expiryThreshold): Promise<true> {
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
						if (this.printLogs) {
							console.debug(
								`LocalSave | Removing expired data [category:${category} / key:${key} / timestamp:${item.timestamp}]`
							);
						}
						await this.remove(category, key);
					}
				}
			} catch (error) {
				if (this.printLogs) {
					console.error(`LocalSave | Expiring data older than '${days}' days failed`, error);
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
	 * @throws {Error} Will reject the promise if an error occurs during the deletion process.
	 */
	async destroy() {
		return new Promise<true>((resolve, reject) => {
			const deleteRequest = indexedDB.deleteDatabase(this.dbName);
			deleteRequest.onsuccess = () => resolve(true);
			deleteRequest.onerror = () => reject(deleteRequest.error);
		});
	}
}
export type DBName = string;
export type EncryptKey = string;
export type Category = string;
export type DBItem = {
	timestamp: number;
	data: unknown;
};
export type DBItemEncrypted = {
	iv: number[];
	data: ArrayBuffer;
};
export type DBItemEncryptedBase64 = string;
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
	 * Should be a string without spaces of length 16, 24, or 32 characters
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

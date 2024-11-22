import CryptoJS from "crypto-js";

class LocalSave {
	dbName: DBName = "LocalSave";
	encryptKey?: EncryptKey;
	categories: Category[] = ["userData"];
	printDebug: Boolean = false;
	constructor(config: Config) {
		this.dbName = config?.dbName ?? this.dbName;
		this.encryptKey = config?.encryptKey;
		this.categories = config?.categories ?? this.categories;
		this.printDebug = config?.printDebug ?? this.printDebug;
	}
	private openDB() {
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
	private encryptData(data: CryptoJS.lib.WordArray | string) {
		if (!this.encryptKey) {
			return data;
		}
		return CryptoJS.AES.encrypt(data, this.encryptKey).toString();
	}
	private decryptData(data: CryptoJS.lib.CipherParams | string) {
		try {
			if (!this.encryptKey) {
				return data;
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
	 * @param category The category to store the data in
	 * @param itemKey The key to store the data under
	 * @param data The data to store, expects a JSON serializable object
	 */
	async set(category: Category, itemKey: IDBValidKey, data: unknown) {
		const db = await this.openDB();
		const payload = {
			timestamp: Date.now(),
			data,
		};
		return new Promise<true>((resolve, reject) => {
			const transaction = db.transaction(category, "readwrite");
			const store = transaction.objectStore(category);
			const encryptedData = this.encryptKey ? this.encryptData(JSON.stringify(payload)) : payload;
			const putRequest = store.put(encryptedData, itemKey);
			putRequest.onsuccess = () => {
				resolve(true);
			};
			putRequest.onerror = () => {
				reject(putRequest.error);
			};
		});
	}

	private async getStore(category: Category) {
		const db = await this.openDB();
		const transaction = db.transaction(category, "readonly");
		return transaction.objectStore(category);
	}
	/**
	 * @param category The category to get the data from
	 * @param itemKey The key to get the data from
	 */
	get(category: Category, itemKey: IDBValidKey) {
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
						console.trace("Error in getting local save data", e);
						store.clear();
					}
				};
				getRequest.onerror = () => {
					reject(getRequest.error);
				};
			});
		});
	}
	/**
	 * @param category The category to remove the data from
	 * @param itemKey The key to remove the data from
	 */
	async remove(category: Category, itemKey: IDBValidKey) {
		const db = await this.openDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(category, "readwrite");
			const store = transaction.objectStore(category);
			const deleteRequest = store.delete(itemKey);
			deleteRequest.onsuccess = () => {
				resolve(true);
			};
			deleteRequest.onerror = () => {
				reject(deleteRequest.error);
			};
		});
	}
	/**
	 * @param category The category to clear
	 */
	async clear(category: Category) {
		const db = await this.openDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(category, "readwrite");
			const store = transaction.objectStore(category);
			const clearRequest = store.clear();
			clearRequest.onsuccess = () => {
				resolve(true);
			};
			clearRequest.onerror = () => {
				reject(clearRequest.error);
			};
		});
	}
	async expire(days = 30) {
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
					console.error(`Error expiring data older than ${days} days`, e);
				}
			}
		}
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
	 * @default "LocalSave"
	 */
	dbName: DBName;
	/**
	 * The key to use for encrypting and decrypting data
	 * Not providing this will store data in plain text
	 * If you provide this, make sure to set it before using any other functions
	 * No spaces are allowed in the key
	 * @default undefined
	 */
	encryptKey?: EncryptKey;
	/**
	 * The categories to use for storing data
	 * You can use these to separate different types of data
	 * No spaces are allowed in the key
	 * @default ["userData"]
	 */
	categories: Category[];
	/**
	 * Whether to print debug logs
	 * @default false
	 */
	printDebug: Boolean;
}
export default LocalSave;

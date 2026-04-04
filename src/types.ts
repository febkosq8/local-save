/**
 * IndexedDB database name.
 */
export type DBName = string;

/**
 * Raw encryption key string used to derive an AES-GCM key.
 */
export type EncryptionKey = string;

/**
 * Object store name used as a logical category.
 */
export type Category = string;

/**
 * Number expected to be positive by runtime validation.
 */
export type PositiveNumber = number;

/**
 * Canonical record structure stored by LocalSave before encryption.
 */
export interface DBItem {
    /** Unix timestamp in milliseconds when the item was written. */
    timestamp: number;
    /** User payload associated with the key. */
    data: unknown;
}

/**
 * Base64 payload containing IV + encrypted record bytes.
 */
export type DBItemEncryptedBase64 = string;

/**
 * Configuration options for constructing LocalSave.
 */
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
     *
     * @default ["userData"]
     */
    categories?: Category[];
    /**
     * The threshold in milliseconds for expiring data.
     *
     * Example day-to-ms conversion: days * 24 * 60 * 60 * 1000
     *
     * Default is 30 days - 30 * 24 * 60 * 60 * 1000
     * @default 2592000000
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

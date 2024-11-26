# local-save

`local-save` is a lightweight wrapper around IndexedDB for secure and structured client-side data storage. It provides encryption, expiration, and organized data storage across configurable categories.

---

## Features

-   **Lightweight & Widespread Support:** No external dependencies and works in all modern browsers.
-   **TypeScript Support :** Written in TypeScript for maximum type-safety and a great developer experience.
-   **Encryption Support :** Uses [SubtleCrypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) for secure data encryption with [AES-GCM](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-gcm) algorithm.
-   **Category Management :** Organize data into predefined categories.
-   **Data Expiry :** Allows setting an expiration threshold for data and a method to clear expired data.
-   **IndexedDB Management :** Handles IndexedDB, object store creation and IndexedDB versioning management automatically.
-   **Logging :** Debug logs for detailed insights.

---

## Installation

```bash
npm install @febkosq8/local-save
```

---

## Usage

### Configuration Options

| Option Key                | Type       | Default        | Description                                                                                                                                            |
| ------------------------- | ---------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **_dbName_**              | `string`   | `"LocalSave"`  | Name of the IndexedDB database.                                                                                                                        |
| **_encryptionKey_**       | `string`   | `undefined`    | Encryption key that should be either [16, 24, or 32] characters to be used for AES-GCM encryption. If not provided, data will be stored in plain text. |
| **_categories_**          | `string[]` | `["userData"]` | Array of categories (Object store names).                                                                                                              |
| **_expiryThreshold_**     | `number`   | `30`           | Data expiration threshold in days.                                                                                                                     |
| **_clearOnDecryptError_** | `boolean`  | `true`         | Whether to clear a category if decryption fails.                                                                                                       |
| **_printLogs_**           | `boolean`  | `false`        | Whether to print logs (Debug and errors).                                                                                                              |

### Initialization

Create a new instance of `LocalSave` with the available configuration options

```typescript
import LocalSave from "@febkosq8/local-save";
...
const lsConfig = {
  encryptionKey: "MyEncryptionKeyThatIs32CharsLong", // Encryption key for data
  categories: ["userData", "settings"], // Define categories for data storage
  expiryThreshold: 14, // Clear data older than 14 days
};
const localSave = new LocalSave(lsConfig);
```

### Storing data

Set data in a category

```typescript
await localSave.set('userData', 'user001', { name: 'John Doe', age: 30 });
```

### Fetching data

Get data from a category

```typescript
try {
    const localDataFetch = await localSave.get('userData', 'user001');
    const { timestamp, data } = localDataFetch;
    console.log(data); // { name: "John Doe", age: 30 }
    console.log(timestamp); // UNIX timestamp of calling `set` method
    //handle data here
} catch (error) {
    //handle error here
}
```

### Removing data

Remove data from a category

```typescript
await localSave.remove('userData', 'user001');
```

### Clearing a category

Clear all data from a category

```typescript
await localSave.clear('userData');
```

### Clearing expired data

Clear all expired data from all categories

```typescript
// If a value is provided, it will override the default expiry threshold
// This can be placed on top of the file to clear expired data on page load
await localSave.expire(14); // Clear data older than 14 days from all categories
```

### Destroying the entire database

Clear all data from all categories and delete the database

```typescript
await localSave.destroy();
```

### Decrypting data manually

Decrypt data using the encryption key

This is useful when you want to decrypt the `DBItemEncryptedBase64` string manually without using the `get` method

```typescript
const decryptedData = await localSave.decryptData(DBItemEncryptedBase64);
```

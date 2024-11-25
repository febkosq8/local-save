# local-save

`local-save` is a lightweight wrapper around IndexedDB for secure and structured client-side data storage. It provides encryption, expiration, and organized data storage across configurable categories.

---

## Features

- **Encryption Support :** Uses AES-GCM for secure data encryption.
- **Category Management :** Organize data into predefined categories.
- **Data Expiry :** Automatically clears data older than a specified number of days.
- **IndexedDB Management :** Handles object store creation and database versioning automatically.
- **Logging :** Debug logs for detailed insights.

---

## Installation

```bash
npm install @febkosq8/local-save
```

---

## Usage

### Configuration Options

| Option Key              | Type       | Default        | Description                                                                                                                                            |
| ----------------------- | ---------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **dbName**              | `string`   | `"LocalSave"`  | Name of the IndexedDB database.                                                                                                                        |
| **encryptKey**          | `string`   | `undefined`    | Encryption key that should be either [16, 24, or 32] characters to be used for AES-GCM encryption. If not provided, data will be stored in plain text. |
| **categories**          | `string[]` | `["userData"]` | Array of categories (Object store names).                                                                                                              |
| **expiryThreshold**     | `number`   | `30`           | Data expiration threshold in days.                                                                                                                     |
| **clearOnDecryptError** | `boolean`  | `true`         | Whether to clear a category if decryption fails.                                                                                                       |
| **printLogs**           | `boolean`  | `false`        | Whether to print logs (Debug and errors).                                                                                                              |

### Initialization

Create a new instance of `LocalSave` with the available configuration options

```typescript
import LocalSave from "@febkosq8/local-save";
...
const lsConfig = {
  encryptKey: "MyEncryptionKeyThatIs32CharsLong", // Encryption key for data
  categories: ["userData", "settings"], // Define categories for data storage
  expiryThreshold: 14, // Clear data older than 14 days
};
const localSave = new LocalSave(lsConfig);
```

### Set Data

Set data in a category

```typescript
await localSave.set("userData", "user001", { name: "John Doe", age: 30 });
```

### Get Data

Get data from a category

```typescript
try {
	const localDataFetch = await localSave.get("userData", "user001");
	const { timestamp, data } = localDataFetch;
	console.log(data); // { name: "John Doe", age: 30 }
	console.log(timestamp); // UNIX timestamp of calling `set` method
	//handle data here
} catch (error) {
	//handle error here
}
```

### Remove Data

Remove data from a category

```typescript
await localSave.remove("userData", "user001");
```

### Clear Category

Clear all data from a category

```typescript
await localSave.clear("userData");
```

### Clear Expired Data

Clear all expired data from all categories

```typescript
// If a value is provided, it will override the default expiry threshold
// This can be placed on top of the file to clear expired data on page load
await localSave.expire(14); // Clear data older than 14 days from all categories
```

### Destroy Whole Database

Clear all data from all categories and delete the database

```typescript
await localSave.destroy();
```

### Decrypt Data Manually

Decrypt data using the encryption key
This is useful when you want to decrypt the `DBItemEncryptedBase64` string manually without using the `get` method

```typescript
const decryptedData = await localSave.decryptData(DBItemEncryptedBase64);
```

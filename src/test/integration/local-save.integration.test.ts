import LocalSave from '@local-save/index';
import {
    createArrayWithRandomValues,
    createObjectWithRandomValues,
    debugLog,
    isDebugLogsEnabled,
    randomString,
} from '@local-save/test/setup';

describe('LocalSave - Integration', { tags: ['integration'] }, ({ beforeEach, afterEach }) => {
    beforeEach(({ task: { fullTestName } }) => {
        debugLog(`>>> Starting run - [ ${fullTestName} ] <<<`);
    });
    afterEach(({ task: { fullTestName } }) => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        debugLog(`<<< Finished run - [ ${fullTestName} ] >>>`);
    });

    test('should fail to retrieve data with a wrong encryption key', { tags: ['integration'] }, async ({ expect }) => {
        const randomKey = randomString(6);
        const randomData = createObjectWithRandomValues(1);
        const primaryLocalSave = new LocalSave({
            encryptionKey: 'ZE69DR2CJVJL9GQ9GW5W8XWRQOJ96R7L',
            clearOnDecryptError: false,
            printLogs: isDebugLogsEnabled(),
        });
        const secondaryLocalSave = new LocalSave({
            encryptionKey: 'IMGN9E5JWONM37PEANMSIJNULLKK5UIT',
            clearOnDecryptError: false,
            printLogs: isDebugLogsEnabled(),
        });

        debugLog('Saving data with using #1 encryption key');
        const writeResult = await primaryLocalSave.set('userData', randomKey, randomData);
        debugLog(`Validating result of set() method\nExpected: true\nActual: ${writeResult}`);
        expect(writeResult).toBe(true);

        debugLog('Attempting to retrieve data using #2 encryption key');
        let thrownError: unknown;
        try {
            await secondaryLocalSave.get('userData', randomKey);
        } catch (error) {
            thrownError = error;
        }
        debugLog(`Validating error\nExpected: LocalSaveError: Data decryption failed\nActual: ${String(thrownError)}`);
        expect((thrownError as Error).message).toBe('Data decryption failed');

        await primaryLocalSave.destroy();
        await secondaryLocalSave.destroy();
    });

    test(
        'should clear data on decryption error when clearOnDecryptError is true',
        { tags: ['integration'] },
        async ({ expect }) => {
            const randomKey = randomString(6);
            const randomData = createObjectWithRandomValues(1);
            const primaryLocalSave = new LocalSave({
                encryptionKey: 'ZE69DR2CJVJL9GQ9GW5W8XWRQOJ96R7L',
                clearOnDecryptError: true,
                printLogs: isDebugLogsEnabled(),
            });
            const secondaryLocalSave = new LocalSave({
                encryptionKey: 'IMGN9E5JWONM37PEANMSIJNULLKK5UIT',
                clearOnDecryptError: true,
                printLogs: isDebugLogsEnabled(),
            });

            debugLog('Saving data with using #1 encryption key');
            const writeResult = await primaryLocalSave.set('userData', randomKey, randomData);
            debugLog(`Validating result of set() method\nExpected: true\nActual: ${writeResult}`);
            expect(writeResult).toBe(true);

            debugLog('Attempting to retrieve data using #2 encryption key');
            let thrownError: unknown;
            try {
                await secondaryLocalSave.get('userData', randomKey);
            } catch (error) {
                thrownError = error;
            }
            debugLog(
                `Validating error\nExpected: LocalSaveError: Data decryption failed\nActual: ${String(thrownError)}`,
            );
            expect((thrownError as Error).message).toBe('Data decryption failed');

            debugLog('Fetching keys using #1 encryption key after decryption error');
            const keysAfterError = await primaryLocalSave.listKeys('userData');
            debugLog(`Expected keys : []\nActual keys: ${JSON.stringify(keysAfterError)}`);
            expect(keysAfterError).toHaveLength(0);

            await primaryLocalSave.destroy();
            await secondaryLocalSave.destroy();
        },
    );

    test(
        'should not clear data on decryption error when clearOnDecryptError is false',
        { tags: ['integration'] },
        async ({ expect }) => {
            const randomKey = randomString(6);
            const randomData = createObjectWithRandomValues(1);
            const primaryLocalSave = new LocalSave({
                encryptionKey: '68EW1X83TCNO46AQMMDMDZ365DBX6PU1',
                clearOnDecryptError: false,
                printLogs: isDebugLogsEnabled(),
            });
            const secondaryLocalSave = new LocalSave({
                encryptionKey: '68PCSEY3FVR666A8IR378ODGEW1T3I68',
                clearOnDecryptError: false,
                printLogs: isDebugLogsEnabled(),
            });

            debugLog('Saving data with using #1 encryption key');
            const writeResult = await primaryLocalSave.set('userData', randomKey, randomData);
            debugLog(`Validating result of set() method\nExpected: true\nActual: ${writeResult}`);
            expect(writeResult).toBe(true);

            debugLog('Attempting to retrieve data using #2 encryption key');
            let thrownError: unknown;
            try {
                await secondaryLocalSave.get('userData', randomKey);
            } catch (error) {
                thrownError = error;
            }
            debugLog(
                `Validating error\nExpected: LocalSaveError: Data decryption failed\nActual: ${String(thrownError)}`,
            );
            expect((thrownError as Error).message).toBe('Data decryption failed');

            debugLog('Verifying data still exists after decryption error');
            const keysAfterError = await primaryLocalSave.listKeys('userData');
            debugLog(
                `Expected keys after decryption error: ["${randomKey}"]\nActual keys: ${JSON.stringify(keysAfterError)}`,
            );
            expect(keysAfterError).toEqual([randomKey]);
            const readResult = await primaryLocalSave.get('userData', randomKey);
            debugLog(
                `Validating data integrity after decryption error\nExpected: ${JSON.stringify(randomData)}\nActual: ${JSON.stringify(readResult)}`,
            );
            expect(readResult).toBeDefined();
            expect(readResult).toEqual(
                expect.objectContaining({
                    data: randomData,
                }),
            );
            await primaryLocalSave.destroy();
            await secondaryLocalSave.destroy();
        },
    );

    test('should manage multiple categories independently', { tags: ['integration'] }, async ({ expect }) => {
        const categories = ['userData', 'sessionData', 'cacheData'];
        const randomKey = randomString(6);
        const randomData = createObjectWithRandomValues(2);

        const localSave = new LocalSave({
            categories,
            printLogs: isDebugLogsEnabled(),
        });

        debugLog('Setting data in all three categories using set() method');
        await localSave.set('userData', randomKey, randomData);
        await localSave.set('sessionData', randomKey, randomData);
        await localSave.set('cacheData', randomKey, randomData);

        debugLog('Verifying all categories exist using listCategories() method');
        const allCategories = await localSave.listCategories();
        debugLog(
            `Validating all categories\nExpected: ${JSON.stringify(categories)}\nActual: ${JSON.stringify(allCategories)}`,
        );
        expect(allCategories).toEqual(expect.arrayContaining(categories));

        debugLog("Clearing 'sessionData' category using clear() method");
        const clearResult = await localSave.clear('sessionData');
        debugLog(`Validating clear() result\nExpected: true\nActual: ${clearResult}`);
        expect(clearResult).toBe(true);

        debugLog('Verifying sessionData is empty');
        const sessionKeys = await localSave.listKeys('sessionData');
        debugLog(`Validating sessionData keys\nExpected: []\nActual: ${JSON.stringify(sessionKeys)}`);
        expect(sessionKeys).toHaveLength(0);

        debugLog('Verifying other categories still have data');
        const userDataKeys = await localSave.listKeys('userData');
        debugLog(`Validating userData keys\nExpected: ["${randomKey}"]\nActual: ${JSON.stringify(userDataKeys)}`);
        const cacheDataKeys = await localSave.listKeys('cacheData');
        debugLog(`Validating cacheData keys\nExpected: ["${randomKey}"]\nActual: ${JSON.stringify(cacheDataKeys)}`);
        expect(userDataKeys).toEqual([randomKey]);
        expect(cacheDataKeys).toEqual([randomKey]);

        await localSave.destroy();
    });

    test('should allow reusing a key after deletion', { tags: ['integration'] }, async ({ expect }) => {
        const testKey = 'reuseKey';
        const data1 = createObjectWithRandomValues(1);
        const data2 = createObjectWithRandomValues(2);

        const localSave = new LocalSave({ printLogs: isDebugLogsEnabled() });

        debugLog(`Setting data with key '${testKey}' (iteration 1)`);
        const setResult1 = await localSave.set('userData', testKey, data1);
        debugLog(`Validating set() result\nExpected: true\nActual: ${setResult1}`);
        expect(setResult1).toBe(true);

        debugLog(`Retrieving data with key '${testKey}' (iteration 1)`);
        const getData1 = await localSave.get('userData', testKey);
        expect(getData1).toEqual(expect.objectContaining({ data: data1 }));

        debugLog(`Removing key '${testKey}' using remove() method`);
        const removeResult = await localSave.remove('userData', testKey);
        debugLog(`Validating remove() result\nExpected: true\nActual: ${removeResult}`);
        expect(removeResult).toBe(true);

        debugLog('Verifying key is deleted');
        const getAfterRemove = await localSave.get('userData', testKey);
        debugLog(`Validating get() result after remove()\nExpected: null\nActual: ${JSON.stringify(getAfterRemove)}`);
        expect(getAfterRemove).toBeNull();

        debugLog(`Reusing key '${testKey}' with different data (iteration 2)`);
        const setResult2 = await localSave.set('userData', testKey, data2);
        debugLog(`Validating set() result\nExpected: true\nActual: ${setResult2}`);
        expect(setResult2).toBe(true);

        debugLog(`Retrieving reused key '${testKey}' (iteration 2)`);
        const getData2 = await localSave.get('userData', testKey);
        debugLog(
            `Validating data for reused key\nExpected: ${JSON.stringify(data2)}\nActual: ${JSON.stringify(getData2)}`,
        );
        expect(getData2).toEqual(expect.objectContaining({ data: data2 }));

        await localSave.destroy();
    });

    test(
        'should sync data across multiple instances accessing same database',
        { tags: ['integration'] },
        async ({ expect }) => {
            const testKey = randomString(6);
            const randomData = createObjectWithRandomValues(3);

            const primaryLocalSave = new LocalSave({ printLogs: isDebugLogsEnabled() });
            const secondaryLocalSave = new LocalSave({ printLogs: isDebugLogsEnabled() });

            debugLog('Using primaryLocalSave to set data');
            const setResult = await primaryLocalSave.set('userData', testKey, randomData);
            debugLog(`Validating set() result\nExpected: true\nActual: ${setResult}`);
            expect(setResult).toBe(true);

            debugLog('Using secondaryLocalSave to retrieve the same data');
            const getData = await secondaryLocalSave.get('userData', testKey);
            debugLog(
                `Validating data retrieved by secondaryLocalSave\nExpected: ${JSON.stringify(randomData)}\nActual: ${JSON.stringify(getData)}`,
            );
            expect(getData).toEqual(expect.objectContaining({ data: randomData }));

            debugLog('Using secondaryLocalSave to list keys in userData');
            const keys = await secondaryLocalSave.listKeys('userData');
            debugLog(`Validating userData keys\nExpected: ["${testKey}"]\nActual: ${JSON.stringify(keys)}`);
            expect(keys).toEqual([testKey]);

            debugLog('Using primaryLocalSave to remove the key');
            const removeResult = await primaryLocalSave.remove('userData', testKey);
            debugLog(`Validating remove() result\nExpected: true\nActual: ${removeResult}`);
            expect(removeResult).toBe(true);

            debugLog('Using secondaryLocalSave to verify key was removed');
            const keysAfterRemove = await secondaryLocalSave.listKeys('userData');
            debugLog(`Validating keys after remove\nExpected: []\nActual: ${JSON.stringify(keysAfterRemove)}`);
            expect(keysAfterRemove).toHaveLength(0);

            await primaryLocalSave.destroy();
            await secondaryLocalSave.destroy();
        },
    );

    test(
        'should not access data with different encryption key in parallel instances',
        { tags: ['integration'] },
        async ({ expect }) => {
            const encryptionKey1 = 'JD5ORN30LTX09M5T4G8D5112ORJ90BYD';
            const encryptionKey2 = 'H8Z0V6AQTQI8FOSUSRNZIZQICJY0ZZTI';
            const testKey = randomString(6);
            const randomData = createObjectWithRandomValues(2);

            const primaryLocalSave = new LocalSave({
                encryptionKey: encryptionKey1,
                clearOnDecryptError: false,
                printLogs: isDebugLogsEnabled(),
            });
            const secondaryLocalSave = new LocalSave({
                encryptionKey: encryptionKey2,
                clearOnDecryptError: false,
                printLogs: isDebugLogsEnabled(),
            });

            debugLog('Setting data with primaryLocalSave (encryptionKey1)');
            const setResult = await primaryLocalSave.set('userData', testKey, randomData);
            debugLog(`Validating set() result\nExpected: true\nActual: ${setResult}`);
            expect(setResult).toBe(true);

            debugLog('Attempting to retrieve data with secondaryLocalSave (encryptionKey2)');
            let thrownError: unknown;
            try {
                await secondaryLocalSave.get('userData', testKey);
            } catch (error) {
                thrownError = error;
            }
            debugLog(
                `Validating error on decryption\nExpected: LocalSaveError: Data decryption failed\nActual: ${String(thrownError)}`,
            );
            expect(thrownError).toBeDefined();
            expect((thrownError as Error).message).toBe('Data decryption failed');

            await primaryLocalSave.destroy();
            await secondaryLocalSave.destroy();
        },
    );

    test('should clear all data across multiple categories', { tags: ['integration'] }, async ({ expect }) => {
        const categories = ['userData', 'sessionData', 'cacheData'];
        const keys = createArrayWithRandomValues(3);
        const randomData = createObjectWithRandomValues(2);

        const localSave = new LocalSave({
            categories,
            printLogs: isDebugLogsEnabled(),
        });

        debugLog('Setting data across multiple categories');
        for (let i = 0; i < categories.length; i++) {
            for (let j = 0; j < keys.length; j++) {
                const setResult = await localSave.set(categories[i], `${keys[j]}_${i}`, randomData);
                debugLog(
                    `Validating set() result for category "${categories[i]}" with key "${keys[j]}_${i}"\nExpected: true\nActual: ${setResult}`,
                );
                expect(setResult).toBe(true);
            }
        }

        debugLog('Verifying all categories have data using listKeys()');
        for (const category of categories) {
            const categoryKeys = await localSave.listKeys(category);
            debugLog(
                `Validating keys for category '${category}'\nExpected: ${JSON.stringify(keys)}\nActual: ${JSON.stringify(categoryKeys)}`,
            );
            expect(categoryKeys).toHaveLength(keys.length);
        }

        debugLog('Clearing all categories using clear()');
        for (const category of categories) {
            const clearResult = await localSave.clear(category);
            debugLog(`Validating clear() for '${category}'\nExpected: true\nActual: ${clearResult}`);
            expect(clearResult).toBe(true);
        }

        debugLog('Verifying all categories are empty');
        for (const category of categories) {
            const categoryKeys = await localSave.listKeys(category);
            debugLog(
                `Validating keys for category '${category}'\nExpected: []\nActual: ${JSON.stringify(categoryKeys)}`,
            );
            expect(categoryKeys).toHaveLength(0);
        }

        await localSave.destroy();
    });

    test(
        'should access same data from fresh instance with matching configuration',
        { tags: ['integration'] },
        async ({ expect }) => {
            const testKey = randomString(6);
            const randomData = createObjectWithRandomValues(4);

            const primaryLocalSave = new LocalSave({ printLogs: isDebugLogsEnabled() });
            const secondaryLocalSave = new LocalSave({ printLogs: isDebugLogsEnabled() });

            debugLog('Using primaryLocalSave to set data');
            const setResult = await primaryLocalSave.set('userData', testKey, randomData);
            debugLog(`Validating set() result\nExpected: true\nActual: ${setResult}`);
            expect(setResult).toBe(true);

            debugLog('Verifying secondaryLocalSave can access data set by primaryLocalSave');
            const retrievedData = await secondaryLocalSave.get('userData', testKey);
            debugLog(
                `Validating retrieved data\nExpected: ${JSON.stringify(randomData)}\nActual: ${JSON.stringify(retrievedData?.data)}`,
            );
            expect(retrievedData).toBeDefined();
            expect(retrievedData).toEqual(expect.objectContaining({ data: randomData }));

            debugLog('Verifying key appears in secondaryLocalSave listKeys()');
            const keys = await secondaryLocalSave.listKeys('userData');
            debugLog(`Validating userData keys\nExpected: ["${testKey}"]\nActual: ${JSON.stringify(keys)}`);
            expect(keys).toEqual([testKey]);

            debugLog('Destroying both instances');
            await primaryLocalSave.destroy();
            await secondaryLocalSave.destroy();
        },
    );

    test('should expire stale items while keeping fresh items', { tags: ['integration'] }, async ({ expect }) => {
        const staleKey = 'staleKey';
        const freshKey = 'freshKey';
        const staleData = createObjectWithRandomValues(1);
        const freshData = createObjectWithRandomValues(1);
        const baseTime = new Date();
        const localSave = new LocalSave({ printLogs: isDebugLogsEnabled() });

        vi.useFakeTimers();
        vi.setSystemTime(baseTime);

        debugLog('Setting stale item at base time');
        const staleSetResult = await localSave.set('userData', staleKey, staleData);
        debugLog(`Validating set() result for stale item\nExpected: true\nActual: ${staleSetResult}`);
        expect(staleSetResult).toBe(true);

        vi.setSystemTime(baseTime.getTime() + 2 * 24 * 60 * 60 * 1000);

        debugLog('Setting fresh item two days after base time');
        const freshSetResult = await localSave.set('userData', freshKey, freshData);
        debugLog(`Validating set() result for fresh item\nExpected: true\nActual: ${freshSetResult}`);
        expect(freshSetResult).toBe(true);

        debugLog('Current keys before expire()');
        const keysBeforeExpire = await localSave.listKeys('userData');
        debugLog(
            `Validating keys before expire()\nExpected: ["${staleKey}", "${freshKey}"]\nActual: ${JSON.stringify(keysBeforeExpire)}`,
        );
        expect(keysBeforeExpire).toEqual(expect.arrayContaining([staleKey, freshKey]));

        debugLog('Expiring data older than 1 day in milliseconds');
        const expireResult = await localSave.expire(24 * 60 * 60 * 1000);
        debugLog(`Validating expire() result\nExpected: true\nActual: ${expireResult}`);
        expect(expireResult).toBe(true);

        debugLog('Verifying only fresh key remains after expire()');
        const keysAfterExpire = await localSave.listKeys('userData');
        debugLog(`Validating keys\nExpected: ["${freshKey}"]\nActual: ${JSON.stringify(keysAfterExpire)}`);
        expect(keysAfterExpire).toEqual([freshKey]);

        const staleItem = await localSave.get('userData', staleKey);
        debugLog(`Validating stale item data\nExpected: null\nActual: ${JSON.stringify(staleItem)}`);
        expect(staleItem).toBeNull();

        const freshItem = await localSave.get('userData', freshKey);
        debugLog(
            `Validating fresh item data\nExpected: ${JSON.stringify(freshData)}\nActual: ${JSON.stringify(freshItem)}`,
        );
        expect(freshItem).toEqual(expect.objectContaining({ data: freshData }));

        await localSave.destroy();
        vi.useRealTimers();
    });

    test('should keep overwritten key when expiring older data', { tags: ['integration'] }, async ({ expect }) => {
        const reusableKey = 'overwriteKey';
        const oldData = createObjectWithRandomValues(1);
        const newData = createObjectWithRandomValues(2);
        const baseTime = new Date();
        const localSave = new LocalSave({ printLogs: isDebugLogsEnabled() });

        vi.useFakeTimers();
        vi.setSystemTime(baseTime);

        debugLog('Setting initial value for reusable key at base time');
        const initialSetResult = await localSave.set('userData', reusableKey, oldData);
        debugLog(`Validating initial set() result\nExpected: true\nActual: ${initialSetResult}`);
        expect(initialSetResult).toBe(true);

        vi.setSystemTime(baseTime.getTime() + 2 * 24 * 60 * 60 * 1000);

        debugLog('Overwriting same key with newer value');
        const overwriteResult = await localSave.set('userData', reusableKey, newData);
        debugLog(`Validating overwrite set() result\nExpected: true\nActual: ${overwriteResult}`);
        expect(overwriteResult).toBe(true);

        debugLog('Expiring data older than 1 day in milliseconds');
        const expireResult = await localSave.expire(24 * 60 * 60 * 1000);
        debugLog(`Validating expire() result\nExpected: true\nActual: ${expireResult}`);
        expect(expireResult).toBe(true);

        debugLog('Verifying keys after expire()');
        const keys = await localSave.listKeys('userData');
        debugLog(`Validating keys\nExpected: ["${reusableKey}"]\nActual: ${JSON.stringify(keys)}`);
        expect(keys).toEqual([reusableKey]);

        debugLog('Verifying value for reusable key is the new data, not expired old data');
        const readResult = await localSave.get('userData', reusableKey);
        debugLog(`Validating value\nExpected: ${JSON.stringify(newData)}\nActual: ${JSON.stringify(readResult)}`);
        expect(readResult).toEqual(expect.objectContaining({ data: newData }));

        await localSave.destroy();
        vi.useRealTimers();
    });

    test(
        'should keep valid category data untouched after invalid get() fails',
        { tags: ['integration'] },
        async ({ expect }) => {
            const validKey = randomString(6);
            const validData = createObjectWithRandomValues(2);
            const invalidCategory = 'notConfiguredCategory';
            const localSave = new LocalSave({
                categories: ['userData'],
                printLogs: isDebugLogsEnabled(),
            });

            debugLog("Setting valid data in 'userData' category");
            const setResult = await localSave.set('userData', validKey, validData);
            debugLog(`Validating set() result\nExpected: true\nActual: ${setResult}`);
            expect(setResult).toBe(true);

            debugLog("Running get() on invalid category 'notConfiguredCategory' and expecting an error");
            let thrownError: unknown;
            try {
                await localSave.get(invalidCategory, validKey);
            } catch (error) {
                thrownError = error;
            }
            debugLog(
                `Validating error\nExpected: LocalSaveError: Requested object store not found in current database version [category:notConfiguredCategory / dbName:LocalSave / version:1].\nActual: ${String(thrownError)}`,
            );
            expect((thrownError as Error).message).toContain(
                'Requested object store not found in current database version',
            );

            debugLog("Listing keys in 'userData' category");
            const keysAfterInvalidGet = await localSave.listKeys('userData');
            debugLog(
                `Validating keys in userData\nExpected: ["${validKey}"]\nActual: ${JSON.stringify(keysAfterInvalidGet)}`,
            );
            expect(keysAfterInvalidGet).toEqual([validKey]);

            debugLog("Retrieving value in 'userData' category");
            const readResult = await localSave.get('userData', validKey);
            debugLog(
                `Validating value in userData\nExpected: ${JSON.stringify(validData)}\nActual: ${JSON.stringify(readResult)}`,
            );
            expect(readResult).toEqual(expect.objectContaining({ data: validData }));

            await localSave.destroy();
        },
    );

    test(
        'should keep valid category data untouched after invalid listKeys() fails',
        { tags: ['integration'] },
        async ({ expect }) => {
            const validKey = randomString(6);
            const validData = createObjectWithRandomValues(2);
            const invalidCategory = 'notConfiguredCategory';
            const localSave = new LocalSave({
                categories: ['userData'],
                printLogs: isDebugLogsEnabled(),
            });

            debugLog("Setting valid data in 'userData' category");
            const setResult = await localSave.set('userData', validKey, validData);
            debugLog(`Validating set() result\nExpected: true\nActual: ${setResult}`);
            expect(setResult).toBe(true);

            debugLog("Running listKeys() on invalid category 'notConfiguredCategory' and expecting an error");
            let thrownError: unknown;
            try {
                await localSave.listKeys(invalidCategory);
            } catch (error) {
                thrownError = error;
            }
            debugLog(
                `Validating error\nExpected: LocalSaveError: Requested object store not found in current database version [category:notConfiguredCategory / dbName:LocalSave / version:1].\nActual: ${String(thrownError)}`,
            );
            expect((thrownError as Error).message).toContain(
                'Requested object store not found in current database version',
            );

            debugLog("Listing keys in 'userData' category");
            const keysAfterInvalidList = await localSave.listKeys('userData');
            debugLog(
                `Validating keys in userData\nExpected: ["${validKey}"]\nActual: ${JSON.stringify(keysAfterInvalidList)}`,
            );
            expect(keysAfterInvalidList).toEqual([validKey]);

            debugLog("Retrieving value in 'userData' category");
            const readResult = await localSave.get('userData', validKey);
            debugLog(
                `Validating value in userData\nExpected: ${JSON.stringify(validData)}\nActual: ${JSON.stringify(readResult)}`,
            );
            expect(readResult).toEqual(expect.objectContaining({ data: validData }));

            await localSave.destroy();
        },
    );

    test(
        'should keep valid category data untouched after invalid remove() fails',
        { tags: ['integration'] },
        async ({ expect }) => {
            const validKey = randomString(6);
            const validData = createObjectWithRandomValues(2);
            const invalidCategory = 'notConfiguredCategory';
            const localSave = new LocalSave({
                categories: ['userData'],
                printLogs: isDebugLogsEnabled(),
            });

            debugLog("Setting valid data in 'userData' category");
            const setResult = await localSave.set('userData', validKey, validData);
            debugLog(`Validating set() result\nExpected: true\nActual: ${setResult}`);
            expect(setResult).toBe(true);

            debugLog("Running remove() on invalid category 'notConfiguredCategory' and expecting an error");
            let thrownError: unknown;
            try {
                await localSave.remove(invalidCategory, validKey);
            } catch (error) {
                thrownError = error;
            }
            debugLog(
                `Validating error\nExpected: LocalSaveError: Requested object store not found in current database version [category:notConfiguredCategory / dbName:LocalSave / version:1].\nActual: ${String(thrownError)}`,
            );
            expect((thrownError as Error).message).toContain(
                'Requested object store not found in current database version',
            );

            debugLog("Listing keys in 'userData' category");
            const keysAfterInvalidRemove = await localSave.listKeys('userData');
            debugLog(
                `Validating keys in userData\nExpected: ["${validKey}"]\nActual: ${JSON.stringify(keysAfterInvalidRemove)}`,
            );

            debugLog("Retrieving value in 'userData' category");
            const readResult = await localSave.get('userData', validKey);
            debugLog(
                `Validating value in userData\nExpected: ${JSON.stringify(validData)}\nActual: ${JSON.stringify(readResult)}`,
            );
            expect(keysAfterInvalidRemove).toEqual([validKey]);
            expect(readResult).toEqual(expect.objectContaining({ data: validData }));

            await localSave.destroy();
        },
    );

    test(
        'should keep valid category data untouched after invalid clear() fails',
        { tags: ['integration'] },
        async ({ expect }) => {
            const validKey = randomString(6);
            const validData = createObjectWithRandomValues(2);
            const invalidCategory = 'notConfiguredCategory';
            const localSave = new LocalSave({
                categories: ['userData'],
                printLogs: isDebugLogsEnabled(),
            });

            debugLog("Setting valid data in 'userData' category");
            const setResult = await localSave.set('userData', validKey, validData);
            debugLog(`Validating set() result\nExpected: true\nActual: ${setResult}`);
            expect(setResult).toBe(true);

            debugLog("Running clear() on invalid category 'notConfiguredCategory' and expecting an error");
            let clearThrownError: unknown;
            try {
                await localSave.clear(invalidCategory);
            } catch (error) {
                clearThrownError = error;
            }
            debugLog(
                `Validating error\nExpected: LocalSaveError: Requested object store not found in current database version [category:notConfiguredCategory / dbName:LocalSave / version:1].\nActual: ${String(clearThrownError)}`,
            );
            expect((clearThrownError as Error).message).toContain(
                'Requested object store not found in current database version',
            );

            debugLog("Listing keys in 'userData' category");
            const keysAfterInvalidClear = await localSave.listKeys('userData');
            debugLog(
                `Validating keys in userData\nExpected: ["${validKey}"]\nActual: ${JSON.stringify(keysAfterInvalidClear)}`,
            );
            expect(keysAfterInvalidClear).toEqual([validKey]);

            debugLog("Retrieving value in 'userData' category");
            const readResult = await localSave.get('userData', validKey);
            debugLog(
                `Validating value in userData\nExpected: ${JSON.stringify(validData)}\nActual: ${JSON.stringify(readResult)}`,
            );
            expect(readResult).toEqual(expect.objectContaining({ data: validData }));

            await localSave.destroy();
        },
    );

    test('should isolate destroy() by dbName', { tags: ['integration'] }, async ({ expect }) => {
        const dbNamePrimary = `LocalSave_primary_${randomString(6)}`;
        const dbNameSecondary = `LocalSave_secondary_${randomString(6)}`;
        const primaryKey = randomString(6);
        const secondaryKey = randomString(6);
        const primaryData = createObjectWithRandomValues(1);
        const secondaryData = createObjectWithRandomValues(1);

        const primaryLocalSave = new LocalSave({
            dbName: dbNamePrimary,
            printLogs: isDebugLogsEnabled(),
        });
        const secondaryLocalSave = new LocalSave({
            dbName: dbNameSecondary,
            printLogs: isDebugLogsEnabled(),
        });

        debugLog('Setting data in primary database');
        const primarySetResult = await primaryLocalSave.set('userData', primaryKey, primaryData);
        debugLog(`Validating primary set() result\nExpected: true\nActual: ${primarySetResult}`);
        expect(primarySetResult).toBe(true);

        debugLog('Setting data in secondary database');
        const secondarySetResult = await secondaryLocalSave.set('userData', secondaryKey, secondaryData);
        debugLog(`Validating secondary set() result\nExpected: true\nActual: ${secondarySetResult}`);
        expect(secondarySetResult).toBe(true);

        debugLog('Destroying only primary database');
        const destroyPrimaryResult = await primaryLocalSave.destroy();
        debugLog(`Validating destroy() result\nExpected: true\nActual: ${destroyPrimaryResult}`);
        expect(destroyPrimaryResult).toBe(true);

        debugLog('Listing keys in secondary database');
        const secondaryKeys = await secondaryLocalSave.listKeys('userData');
        debugLog(`Validating secondary keys\nExpected: ["${secondaryKey}"]\nActual: ${JSON.stringify(secondaryKeys)}`);
        expect(secondaryKeys).toEqual([secondaryKey]);

        debugLog('Retrieving data from secondary database');
        const secondaryRead = await secondaryLocalSave.get('userData', secondaryKey);
        debugLog(
            `Validating secondary data\nExpected: ${JSON.stringify(secondaryData)}\nActual: ${JSON.stringify(secondaryRead)}`,
        );
        expect(secondaryRead).toEqual(expect.objectContaining({ data: secondaryData }));

        await secondaryLocalSave.destroy();
    });

    test(
        'should clear only the failing category when clearOnDecryptError is true',
        { tags: ['integration'] },
        async ({ expect }) => {
            const categories = createArrayWithRandomValues(2);
            const primaryCategory = categories[0];
            const secondaryCategory = categories[1];
            const primaryKey = randomString(6);
            const secondaryKey = randomString(6);
            const primaryValue = createObjectWithRandomValues(1);
            const secondaryValue = createObjectWithRandomValues(1);

            const primaryLocalSave = new LocalSave({
                categories,
                encryptionKey: 'A52O2W1W2ZQ2DSYWQXFQ34J88A50D9Q2',
                clearOnDecryptError: true,
                printLogs: isDebugLogsEnabled(),
            });
            const secondaryLocalSave = new LocalSave({
                categories,
                encryptionKey: 'QDH8EVB2SR7KIB02SPT2S4RLD7MKG3R0',
                clearOnDecryptError: true,
                printLogs: isDebugLogsEnabled(),
            });

            debugLog(`Writing encrypted data into '${primaryCategory}' using primaryLocalSave`);
            const userSetResult = await primaryLocalSave.set(primaryCategory, primaryKey, primaryValue);
            debugLog(`Validating '${primaryCategory}' set() result\nExpected: true\nActual: ${userSetResult}`);
            expect(userSetResult).toBe(true);

            debugLog(`Writing encrypted data into '${secondaryCategory}' using primaryLocalSave`);
            const sessionSetResult = await primaryLocalSave.set(secondaryCategory, secondaryKey, secondaryValue);
            debugLog(`Validating '${secondaryCategory}' set() result\nExpected: true\nActual: ${sessionSetResult}`);
            expect(sessionSetResult).toBe(true);

            debugLog(`Triggering decryption error only in '${primaryCategory}' using secondaryLocalSave`);
            let decryptionThrownError: unknown;
            try {
                await secondaryLocalSave.get(primaryCategory, primaryKey);
            } catch (error) {
                decryptionThrownError = error;
            }
            debugLog(
                `Validating error\nExpected: LocalSaveError: Data decryption failed\nActual: ${String(decryptionThrownError)}`,
            );
            expect((decryptionThrownError as Error).message).toBe('Data decryption failed');

            debugLog(`Verifying '${primaryCategory}' is cleared while '${secondaryCategory}' stays intact`);
            debugLog(`Listing keys in '${primaryCategory}' category`);
            const userDataKeysAfterError = await primaryLocalSave.listKeys(primaryCategory);
            debugLog(
                `Validating '${primaryCategory}' keys\nExpected: []\nActual: ${JSON.stringify(userDataKeysAfterError)}`,
            );
            expect(userDataKeysAfterError).toHaveLength(0);

            debugLog(`Listing keys in '${secondaryCategory}' category`);
            const sessionDataKeysAfterError = await primaryLocalSave.listKeys(secondaryCategory);
            debugLog(
                `Validating '${secondaryCategory}' keys\nExpected: ["${secondaryKey}"]\nActual: ${JSON.stringify(sessionDataKeysAfterError)}`,
            );
            expect(sessionDataKeysAfterError).toEqual([secondaryKey]);

            debugLog(`Retrieving value in '${secondaryCategory}' category`);
            const sessionDataRead = await primaryLocalSave.get(secondaryCategory, secondaryKey);
            debugLog(
                `Validating '${secondaryCategory}' value\nExpected: ${JSON.stringify(secondaryValue)}\nActual: ${JSON.stringify(sessionDataRead)}`,
            );
            expect(sessionDataRead).toEqual(expect.objectContaining({ data: secondaryValue }));

            await primaryLocalSave.destroy();
            await secondaryLocalSave.destroy();
        },
    );
});

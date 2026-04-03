import LocalSave from '@local-save/index';
import {
    createArrayWithRandomValues,
    createObjectWithRandomValues,
    debugLog,
    isDebugLogsEnabled,
    randomString,
} from '@local-save/test/test-utils';

describe('LocalSave - Integration', { tags: ['integration'] }, ({ beforeEach, afterEach }) => {
    beforeEach(({ task: { fullTestName } }) => {
        console.log(`>>> Starting run - [ ${fullTestName} ] <<<`);
    });
    afterEach(({ task: { fullTestName } }) => {
        console.log(`<<< Finished run - [ ${fullTestName} ] >>>`);
    });

    test('should fail to retrieve data with a wrong encryption key', { tags: ['integration'] }, async () => {
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
        async () => {
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

            debugLog('Verifying data is cleared after decryption error');
            const keysAfterError = await primaryLocalSave.listKeys('userData');
            debugLog(`Expected keys after decryption error: []\nActual keys: ${JSON.stringify(keysAfterError)}`);
            expect(keysAfterError).toHaveLength(0);

            await primaryLocalSave.destroy();
            await secondaryLocalSave.destroy();
        },
    );

    test(
        'should not clear data on decryption error when clearOnDecryptError is false',
        { tags: ['integration'] },
        async () => {
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
        debugLog(`Expected categories: ${JSON.stringify(categories)}\nActual: ${JSON.stringify(allCategories)}`);
        expect(allCategories).toEqual(expect.arrayContaining(categories));

        debugLog('Clearing sessionData category using clear() method');
        const clearResult = await localSave.clear('sessionData');
        debugLog(`Validating clear() result\nExpected: true\nActual: ${clearResult}`);
        expect(clearResult).toBe(true);

        debugLog('Verifying sessionData is empty');
        const sessionKeys = await localSave.listKeys('sessionData');
        debugLog(`Expected sessionData keys: []\nActual: ${JSON.stringify(sessionKeys)}`);
        expect(sessionKeys).toHaveLength(0);

        debugLog('Verifying other categories still have data');
        const userDataKeys = await localSave.listKeys('userData');
        const cacheDataKeys = await localSave.listKeys('cacheData');
        debugLog(
            `Expected userData keys: ["${randomKey}"]\nActual: ${JSON.stringify(userDataKeys)}\nExpected cacheData keys: ["${randomKey}"]\nActual: ${JSON.stringify(cacheDataKeys)}`,
        );
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
        debugLog(`Validating get() after remove()\nExpected: null\nActual: ${JSON.stringify(getAfterRemove)}`);
        expect(getAfterRemove).toBeNull();

        debugLog(`Reusing key '${testKey}' with different data (iteration 2)`);
        const setResult2 = await localSave.set('userData', testKey, data2);
        debugLog(`Validating set() result\nExpected: true\nActual: ${setResult2}`);
        expect(setResult2).toBe(true);

        debugLog(`Retrieving reused key '${testKey}' (iteration 2)`);
        const getData2 = await localSave.get('userData', testKey);
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
                `Validating data retrieved by secondaryLocalSave\nExpected: ${JSON.stringify(randomData)}\nActual: ${JSON.stringify(getData?.data)}`,
            );
            expect(getData).toEqual(expect.objectContaining({ data: randomData }));

            debugLog('Using secondaryLocalSave to list keys in userData');
            const keys = await secondaryLocalSave.listKeys('userData');
            debugLog(`Expected keys: ["${testKey}"]\nActual: ${JSON.stringify(keys)}`);
            expect(keys).toEqual([testKey]);

            debugLog('Using primaryLocalSave to remove the key');
            const removeResult = await primaryLocalSave.remove('userData', testKey);
            expect(removeResult).toBe(true);

            debugLog('Using secondaryLocalSave to verify key was removed');
            const keysAfterRemove = await secondaryLocalSave.listKeys('userData');
            debugLog(`Expected keys after remove: []\nActual: ${JSON.stringify(keysAfterRemove)}`);
            expect(keysAfterRemove).toHaveLength(0);

            await primaryLocalSave.destroy();
            await secondaryLocalSave.destroy();
        },
    );

    test(
        'should not access data with different encryption key in parallel instances',
        { tags: ['integration'] },
        async ({ expect }) => {
            const encryptionKey1 = 'ZE69DR2CJVJL9GQ9GW5W8XWRQOJ96R7L';
            const encryptionKey2 = 'IMGN9E5JWONM37PEANMSIJNULLKK5UIT';
            const testKey = randomString(6);
            const randomData = createObjectWithRandomValues(2);

            debugLog('Creating primaryLocalSave with encryptionKey1');
            const primaryLocalSave = new LocalSave({
                encryptionKey: encryptionKey1,
                clearOnDecryptError: false,
                printLogs: isDebugLogsEnabled(),
            });

            debugLog('Creating secondaryLocalSave with encryptionKey2 (different key)');
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
                await localSave.set(categories[i], `${keys[j]}_${i}`, randomData);
            }
        }

        debugLog('Verifying all categories have data using listKeys()');
        for (const category of categories) {
            const categoryKeys = await localSave.listKeys(category);
            debugLog(`Category "${category}" keys: ${JSON.stringify(categoryKeys)}`);
            expect(categoryKeys).toHaveLength(keys.length);
        }

        debugLog('Clearing all categories using clear()');
        for (const category of categories) {
            const clearResult = await localSave.clear(category);
            debugLog(`Validating clear() for "${category}"\nExpected: true\nActual: ${clearResult}`);
            expect(clearResult).toBe(true);
        }

        debugLog('Verifying all categories are empty');
        for (const category of categories) {
            const categoryKeys = await localSave.listKeys(category);
            debugLog(`Expected "${category}" keys: []\nActual: ${JSON.stringify(categoryKeys)}`);
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

            debugLog('Creating primaryLocalSave and setting data');
            const primaryLocalSave = new LocalSave({ printLogs: isDebugLogsEnabled() });
            const setResult = await primaryLocalSave.set('userData', testKey, randomData);
            debugLog(`Validating set() result\nExpected: true\nActual: ${setResult}`);
            expect(setResult).toBe(true);

            debugLog('Creating fresh secondaryLocalSave without destroying primaryLocalSave');
            const secondaryLocalSave = new LocalSave({ printLogs: isDebugLogsEnabled() });

            debugLog('Verifying secondaryLocalSave can access data set by primaryLocalSave');
            const retrievedData = await secondaryLocalSave.get('userData', testKey);
            debugLog(
                `Validating retrieved data\nExpected: ${JSON.stringify(randomData)}\nActual: ${JSON.stringify(retrievedData?.data)}`,
            );
            expect(retrievedData).toBeDefined();
            expect(retrievedData).toEqual(expect.objectContaining({ data: randomData }));

            debugLog('Verifying key appears in secondaryLocalSave listKeys()');
            const keys = await secondaryLocalSave.listKeys('userData');
            debugLog(`Expected keys: ["${testKey}"]\nActual: ${JSON.stringify(keys)}`);
            expect(keys).toEqual([testKey]);

            debugLog('Destroying both instances');
            await primaryLocalSave.destroy();
            await secondaryLocalSave.destroy();
        },
    );
});

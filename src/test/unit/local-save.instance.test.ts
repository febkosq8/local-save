import LocalSave from '@local-save/index';
import {
    createArrayWithRandomValues,
    createObjectWithRandomValues,
    debugLog,
    isDebugLogsEnabled,
    randomString,
} from '@local-save/test/setup';

describe('LocalSave - Instance', { tags: ['instance'] }, ({ beforeEach, afterEach }) => {
    beforeEach(({ task: { fullTestName } }) => {
        console.log(`>>> Starting run - [ ${fullTestName} ] <<<`);
    });
    afterEach(({ task: { fullTestName } }) => {
        console.log(`<<< Finished run - [ ${fullTestName} ] >>>`);
    });

    test('method set() is working', { tags: ['instance'] }, async ({ expect }) => {
        const localSave = new LocalSave({ printLogs: isDebugLogsEnabled() });
        const setResult = await localSave.set('userData', 'testKey', { value: 'testValue' });
        debugLog(`Validating result of set() method\nExpected: true\nActual: ${setResult}`);
        expect(setResult).toBeDefined();
        expect(setResult).toBe(true);
        await localSave.destroy();
    });

    test('method get() is working', { tags: ['instance'] }, async ({ expect }) => {
        const randomKey = randomString(6);
        const randomData = createObjectWithRandomValues(5);
        const localSave = new LocalSave({ printLogs: isDebugLogsEnabled() });
        debugLog(`Created random data for testing get() method\n${JSON.stringify(randomData)}`);
        debugLog(`Setting data using set() method with key '${randomKey}'`);
        await localSave.set('userData', randomKey, randomData);
        debugLog(`Retrieving data using get() method with key '${randomKey}'`);
        const getResult = await localSave.get('userData', randomKey);
        debugLog(
            `Validating result of get() method\nExpected: ${JSON.stringify(randomData)}\nActual: ${JSON.stringify(getResult)}`,
        );
        expect(getResult).toBeDefined();
        expect(getResult).toEqual(
            expect.objectContaining({
                data: randomData,
            }),
        );
        await localSave.destroy();
    });

    test('method listCategories() is working', { tags: ['instance'] }, async ({ expect }) => {
        const randomCategories = createArrayWithRandomValues(3);
        debugLog('Created random categories for testing listCategories() method:', randomCategories);
        const localSave = new LocalSave({ categories: randomCategories, printLogs: isDebugLogsEnabled() });
        const categoriesResult = await localSave.listCategories();
        debugLog(
            `Validating result of listCategories() method\nExpected: ${JSON.stringify(randomCategories)}\nActual: ${JSON.stringify(categoriesResult)}`,
        );
        expect(categoriesResult).toBeDefined();
        expect(categoriesResult).toHaveLength(randomCategories.length);
        expect(categoriesResult).toEqual(expect.arrayContaining(randomCategories));
        await localSave.destroy();
    });

    test('method listKeys() is working', { tags: ['instance'] }, async ({ expect }) => {
        const randomKeys = createArrayWithRandomValues(2);
        debugLog('Created random keys for testing listKeys() method:', randomKeys);
        const randomValues = createObjectWithRandomValues(2);
        debugLog('Created random values for testing listKeys() method:', randomValues);
        const localSave = new LocalSave({ printLogs: isDebugLogsEnabled() });
        debugLog('Setting data for multiple keys using set() method');
        await localSave.set('userData', randomKeys[0], randomValues);
        await localSave.set('userData', randomKeys[1], randomValues);
        debugLog(`Retrieving keys using listKeys() method`);
        const keysResult = await localSave.listKeys('userData');
        debugLog(
            `Validating result of listKeys() method\nExpected: ${JSON.stringify(randomKeys)}\nActual: ${JSON.stringify(keysResult)}`,
        );
        expect(keysResult).toBeDefined();
        expect(keysResult).toEqual(expect.arrayContaining(randomKeys));
        expect(keysResult).toHaveLength(2);
        await localSave.destroy();
    });

    test('method remove() is working', { tags: ['instance'] }, async ({ expect }) => {
        const randomKeys = createArrayWithRandomValues(2);
        debugLog('Created random keys for testing listKeys() method:', randomKeys);
        const randomValues = createObjectWithRandomValues(2);
        debugLog('Created random values for testing listKeys() method:', randomValues);
        const localSave = new LocalSave({ printLogs: isDebugLogsEnabled() });
        debugLog('Setting data for multiple keys using set() method');
        await localSave.set('userData', randomKeys[0], randomValues);
        await localSave.set('userData', randomKeys[1], randomValues);
        debugLog(`Retrieving keys using listKeys() method`);
        const keysResultPreRemove = await localSave.listKeys('userData');
        debugLog(`Result of listKeys() method - pre delete: ${JSON.stringify(keysResultPreRemove)}`);
        expect(keysResultPreRemove).toEqual(expect.arrayContaining(randomKeys));
        expect(keysResultPreRemove).toHaveLength(2);
        debugLog(`Removing key '${randomKeys[0]}' using remove() method`);
        const removeResult = await localSave.remove('userData', randomKeys[0]);
        debugLog(`Validating result of remove() method\nExpected: true\nActual: ${removeResult}`);
        expect(removeResult).toBe(true);
        const keysResultPostRemove = await localSave.listKeys('userData');
        debugLog(`Result of listKeys() method - post remove: ${JSON.stringify(keysResultPostRemove)}`);
        expect(keysResultPostRemove).toEqual(expect.arrayContaining([randomKeys[1]]));
        expect(keysResultPostRemove).toHaveLength(1);
        debugLog(`Trying to get removed key '${randomKeys[0]}' using get() method`);
        const getRemovedKeyResultPostDelete = await localSave.get('userData', randomKeys[0]);
        debugLog(
            `Validating result of get() method for removed key\nExpected: null\nActual: ${JSON.stringify(getRemovedKeyResultPostDelete)}`,
        );
        expect(getRemovedKeyResultPostDelete).toBeNull();
        const getValidKeyResultPostDelete = await localSave.get('userData', randomKeys[1]);
        debugLog(
            `Validating result of get() method for valid key - post delete\nExpected: ${JSON.stringify(randomValues)}\nActual: ${JSON.stringify(getValidKeyResultPostDelete)}`,
        );
        expect(getValidKeyResultPostDelete).toBeDefined();
        expect(getValidKeyResultPostDelete).toEqual(
            expect.objectContaining({
                data: randomValues,
            }),
        );
        await localSave.destroy();
    });

    test('method clear() is working', { tags: ['instance'] }, async ({ expect }) => {
        const randomKeys = createArrayWithRandomValues(2);
        debugLog('Created random keys for testing listKeys() method:', randomKeys);
        const randomValues = createObjectWithRandomValues(2);
        debugLog('Created random values for testing listKeys() method:', randomValues);
        const localSave = new LocalSave({ printLogs: isDebugLogsEnabled() });
        debugLog('Setting data for multiple keys using set() method');
        await localSave.set('userData', randomKeys[0], randomValues);
        await localSave.set('userData', randomKeys[1], randomValues);
        debugLog(`Retrieving keys using listKeys() method`);
        const keysResultPreClear = await localSave.listKeys('userData');
        debugLog(`Result of listKeys() method - pre clear: ${JSON.stringify(keysResultPreClear)}`);
        expect(keysResultPreClear).toEqual(expect.arrayContaining(randomKeys));
        expect(keysResultPreClear).toHaveLength(2);
        debugLog(`Clearing category 'userData' using clear() method`);
        const clearResult = await localSave.clear('userData');
        debugLog(`Validating result of clear() method\nExpected: true\nActual: ${clearResult}`);
        expect(clearResult).toBe(true);
        const keysResult = await localSave.listKeys('userData');
        debugLog(`Result of listKeys() method - post clear: ${JSON.stringify(keysResult)}`);
        expect(keysResult).toHaveLength(0);
        await localSave.destroy();
    });

    test('method expire() is working', { tags: ['instance'] }, async ({ expect }) => {
        const randomKeys = createArrayWithRandomValues(2);
        debugLog('Created random keys for testing listKeys() method:', randomKeys);
        const randomValues = createObjectWithRandomValues(2);
        debugLog('Created random values for testing listKeys() method:', randomValues);
        vi.useFakeTimers();
        const baseTime = new Date();
        vi.setSystemTime(baseTime);
        const localSave = new LocalSave({ expiryThreshold: 1, printLogs: isDebugLogsEnabled() });
        debugLog('Setting data for multiple keys using set() method');
        await localSave.set('userData', randomKeys[0], randomValues);
        await localSave.set('userData', randomKeys[1], randomValues);
        debugLog(`Retrieving keys using listKeys() method - pre expire`);
        const keysResultPreExpire = await localSave.listKeys('userData');
        debugLog(`Result of listKeys() method - pre expire: ${JSON.stringify(keysResultPreExpire)}`);
        expect(keysResultPreExpire).toEqual(expect.arrayContaining(randomKeys));
        expect(keysResultPreExpire).toHaveLength(2);
        vi.setSystemTime(baseTime.getTime() + 2 * 24 * 60 * 60 * 1000);
        debugLog(`Expiring items using expire() method`);
        const expireResult = await localSave.expire(1);
        debugLog(`Validating result of expire() method\nExpected: true\nActual: ${expireResult}`);
        expect(expireResult).toBe(true);
        const keysResult = await localSave.listKeys('userData');
        debugLog(`Result of listKeys() method - post expire: ${JSON.stringify(keysResult)}`);
        expect(keysResult).toHaveLength(0);
        await localSave.destroy();
        vi.useRealTimers();
    });

    test('method destroy() is working', { tags: ['instance'] }, async ({ expect }) => {
        const randomKeys = createArrayWithRandomValues(2);
        debugLog('Created random keys for testing listKeys() method:', randomKeys);
        const randomValues = createObjectWithRandomValues(2);
        debugLog('Created random values for testing listKeys() method:', randomValues);
        const localSave = new LocalSave({ printLogs: isDebugLogsEnabled() });
        debugLog('Setting data for multiple keys using set() method');
        await localSave.set('userData', randomKeys[0], randomValues);
        await localSave.set('userData', randomKeys[1], randomValues);
        debugLog(`Retrieving keys using listKeys() method`);
        const keysResultPreDestroy = await localSave.listKeys('userData');
        debugLog(`Result of listKeys() method - pre destroy: ${JSON.stringify(keysResultPreDestroy)}`);
        expect(keysResultPreDestroy).toEqual(expect.arrayContaining(randomKeys));
        expect(keysResultPreDestroy).toHaveLength(2);
        const destroyResult = await localSave.destroy();
        debugLog(`Validating result of destroy() method\nExpected: true\nActual: ${destroyResult}`);
        expect(destroyResult).toBe(true);
        debugLog(`Trying to retrieve keys using listKeys() method after destroy()`);
        const keysResultPostDestroy = await localSave.listKeys('userData');
        debugLog(`Result of listKeys() method - post destroy: ${JSON.stringify(keysResultPostDestroy)}`);
        expect(keysResultPostDestroy).toHaveLength(0);
    });
});

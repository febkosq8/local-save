import LocalSave from '@local-save/index';
import { debugLog, isTestLogsEnabled } from '@local-save/test/test-utils';

describe('LocalSave - No encryption key', { tags: ['instance'] }, () => {
    test('should save and retrieve data', async () => {
        debugLog('>> Testing LocalSave set and get methods without encryption key');
        const localSave = new LocalSave({ printLogs: isTestLogsEnabled() });
        const data = { key: 'value' };
        await localSave.set('userData', 'key', data);
        const retrievedData = await localSave.get('userData', 'key');
        debugLog(`> Expected data: ${JSON.stringify(data)}\nFetched data: ${JSON.stringify(retrievedData)}`);
        expect(retrievedData).toBeDefined();
        expect(retrievedData).toEqual(
            expect.objectContaining({
                data: data,
            }),
        );
        await localSave.destroy();
        debugLog('>> End of test for LocalSave set and get methods without encryption key <<');
    });

    test('should list keys that were created earlier', async () => {
        debugLog('>> Testing LocalSave listKeys method without encryption key');
        const localSave = new LocalSave({ printLogs: isTestLogsEnabled() });
        await localSave.set('userData', 'firstKey', { id: 1 });
        await localSave.set('userData', 'secondKey', { id: 2 });
        const keys = await localSave.listKeys('userData');
        debugLog(`> Expected keys: ["firstKey", "secondKey"]\nFetched keys: ${JSON.stringify(keys)}`);
        expect(keys).toEqual(expect.arrayContaining(['firstKey', 'secondKey']));
        expect(keys).toHaveLength(2);
        await localSave.destroy();
        debugLog('>> End of test for LocalSave listKeys method without encryption key <<');
    });

    test("should fail if trying to retrieve data that doesn't exist", async () => {
        debugLog('>> Testing LocalSave get method for non-existent key without encryption key');
        const localSave = new LocalSave({ printLogs: isTestLogsEnabled() });
        const retrievedData = await localSave.get('userData', 'key');
        expect(retrievedData).toBeNull();
        debugLog(`> Expected: null\nActual: ${JSON.stringify(retrievedData)}`);
        await localSave.destroy();
        debugLog('>> End of test for LocalSave get method for non-existent key without encryption key <<');
    });
});

describe('LocalSave - With encryption key', { tags: ['instance'] }, () => {
    test('should save and retrieve data', async () => {
        debugLog('>> Testing LocalSave set and get methods with encryption key');
        const localSave = new LocalSave({
            encryptionKey: '9HPBXWX87HRY1FSB3S9S7UEVBO1YLB3L',
            printLogs: isTestLogsEnabled(),
        });
        const data = { token: 'secret-value', active: true };
        await localSave.set('userData', 'encryptedKey', data);
        const retrievedData = await localSave.get('userData', 'encryptedKey');
        debugLog(`> Expected data: ${JSON.stringify(data)}\nFetched data: ${JSON.stringify(retrievedData)}`);
        expect(retrievedData).toBeDefined();
        expect(retrievedData).toEqual(
            expect.objectContaining({
                data,
            }),
        );
        await localSave.destroy();
        debugLog('>> End of test for LocalSave set and get methods with encryption key <<');
    });

    test('should list keys that were created earlier', async () => {
        debugLog('>> Testing LocalSave listKeys method with encryption key');
        const localSave = new LocalSave({
            encryptionKey: 'CIPBHYMP4Z95DS1O71FA7KDJTI9SKVY7',
            printLogs: isTestLogsEnabled(),
        });
        await localSave.set('userData', 'encryptedFirstKey', { id: 1 });
        await localSave.set('userData', 'encryptedSecondKey', { id: 2 });
        const keys = await localSave.listKeys('userData');
        debugLog(`> Expected keys: ["encryptedFirstKey", "encryptedSecondKey"]\nFetched keys: ${JSON.stringify(keys)}`);
        expect(keys).toBeDefined();
        expect(keys).toEqual(expect.arrayContaining(['encryptedFirstKey', 'encryptedSecondKey']));
        expect(keys).toHaveLength(2);
        await localSave.destroy();
        debugLog('>> End of test for LocalSave listKeys method with encryption key <<');
    });

    test("should fail if trying to retrieve data that doesn't exist", async () => {
        debugLog('>> Testing LocalSave get method for non-existent key with encryption key');
        const localSave = new LocalSave({
            encryptionKey: 'C2OXEG5XX4ZZBC6BWKVJ8RUB5RON45EE',
            printLogs: isTestLogsEnabled(),
        });
        const retrievedData = await localSave.get('userData', 'missingEncryptedKey');
        debugLog(`> Expected: null\nActual: ${JSON.stringify(retrievedData)}`);
        expect(retrievedData).toEqual(null);
        await localSave.destroy();
        debugLog('>> End of test for LocalSave get method for non-existent key with encryption key <<');
    });
});

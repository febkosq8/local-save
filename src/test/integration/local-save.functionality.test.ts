import LocalSave from '@local-save/index';
import { debugLog, isTestLogsEnabled } from '@local-save/test/test-utils';

describe('LocalSave - No encryption key', () => {
    it('should save and retrieve data', async () => {
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
        // TODO: Uncomment destroy calls after fixing #6
        // await localSave.destroy();
        debugLog('>> End of test for LocalSave set and get methods without encryption key <<');
    });
    it('should list keys that were created earlier', async () => {
        debugLog('>> Testing LocalSave listKeys method without encryption key');
        const localSave = new LocalSave({ printLogs: isTestLogsEnabled() });
        await localSave.set('userData', 'firstKey', { id: 1 });
        await localSave.set('userData', 'secondKey', { id: 2 });
        const keys = await localSave.listKeys('userData');
        debugLog(`> Expected keys: ["firstKey", "secondKey"]\nFetched keys: ${JSON.stringify(keys)}`);
        expect(keys).toEqual(expect.arrayContaining(['firstKey', 'secondKey']));
        expect(keys).toHaveLength(2);
        // TODO: Uncomment destroy calls after fixing #6
        // await localSave.destroy();
        debugLog('>> End of test for LocalSave listKeys method without encryption key <<');
    });
    it("should fail if trying to retrieve data that doesn't exist", async () => {
        debugLog('>> Testing LocalSave get method for non-existent key without encryption key');
        const localSave = new LocalSave({ printLogs: isTestLogsEnabled() });
        const retrievedData = await localSave.get('userData', 'key');
        expect(retrievedData).toBeNull();
        debugLog(`> Expected: null\nActual: ${JSON.stringify(retrievedData)}`);
        // TODO: Uncomment destroy calls after fixing #6
        // await localSave.destroy();
        debugLog('>> End of test for LocalSave get method for non-existent key without encryption key <<');
    });
});

describe('LocalSave - With encryption key', () => {
    it('should save and retrieve data', async () => {
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
        // TODO: Uncomment destroy calls after fixing #6
        // await localSave.destroy();
        debugLog('>> End of test for LocalSave set and get methods with encryption key <<');
    });
    it('should list keys that were created earlier', async () => {
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
        // TODO: Uncomment destroy calls after fixing #6
        // await localSave.destroy();
        debugLog('>> End of test for LocalSave listKeys method with encryption key <<');
    });
    it("should fail if trying to retrieve data that doesn't exist", async () => {
        debugLog('>> Testing LocalSave get method for non-existent key with encryption key');
        const localSave = new LocalSave({
            encryptionKey: 'C2OXEG5XX4ZZBC6BWKVJ8RUB5RON45EE',
            printLogs: isTestLogsEnabled(),
        });
        const retrievedData = await localSave.get('userData', 'missingEncryptedKey');
        debugLog(`> Expected: null\nActual: ${JSON.stringify(retrievedData)}`);
        expect(retrievedData).toEqual(null);
        // TODO: Uncomment destroy calls after fixing #6
        // await localSave.destroy();
        debugLog('>> End of test for LocalSave get method for non-existent key with encryption key <<');
    });
    it('should fail to retrieve data with a wrong encryption key', async () => {
        debugLog('>> Testing LocalSave get method with wrong encryption key');
        const dbName = 'LocalSaveWrongKeyCase';
        const writerLocalSave = new LocalSave({
            dbName,
            encryptionKey: 'ZE69DR2CJVJL9GQ9GW5W8XWRQOJ96R7L',
            clearOnDecryptError: false,
            printLogs: isTestLogsEnabled(),
        });
        const readerLocalSave = new LocalSave({
            dbName,
            encryptionKey: 'IMGN9E5JWONM37PEANMSIJNULLKK5UIT',
            clearOnDecryptError: false,
            printLogs: isTestLogsEnabled(),
        });
        await writerLocalSave.set('userData', 'wrongKeyCase', { secret: 'sensitive' });
        await expect(readerLocalSave.get('userData', 'wrongKeyCase')).rejects.toThrow('Data decryption failed');
        await writerLocalSave.clear('userData');
        // TODO: Uncomment destroy calls after fixing #6
        // await writerLocalSave.destroy();
        // await readerLocalSave.destroy();
        debugLog('>> End of test for LocalSave get method with wrong encryption key <<');
    });
    it('should clear data on decryption error when clearOnDecryptError is true', async () => {
        debugLog('>> Testing LocalSave get method with wrong encryption key and clearOnDecryptError set to true');
        const dbName = 'LocalSaveClearOnDecryptErrorCase';
        const writerLocalSave = new LocalSave({
            dbName,
            encryptionKey: '68EW1X83TCNO46AQMMDMDZ365DBX6PU1',
            clearOnDecryptError: true,
            printLogs: isTestLogsEnabled(),
        });
        const readerLocalSave = new LocalSave({
            dbName,
            encryptionKey: '68PCSEY3FVR666A8IR378ODGEW1T3I68',
            clearOnDecryptError: true,
            printLogs: isTestLogsEnabled(),
        });
        await writerLocalSave.set('userData', 'clearOnError', { secret: 'sensitive' });
        await expect(readerLocalSave.get('userData', 'clearOnError')).rejects.toThrow('Data decryption failed');
        const keysAfterError = await writerLocalSave.listKeys('userData');
        debugLog(`> Expected keys after decryption error: []\nActual keys: ${JSON.stringify(keysAfterError)}`);
        expect(keysAfterError).toEqual([]);
        // TODO: Uncomment destroy calls after fixing #6
        // await writerLocalSave.destroy();
        // await readerLocalSave.destroy();
        debugLog(
            '>> End of test for LocalSave get method with wrong encryption key and clearOnDecryptError set to true <<',
        );
    });
});

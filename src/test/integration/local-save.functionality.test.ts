import LocalSave from '@local-save/index';
import { debugLog, isTestLogsEnabled } from '@local-save/test/test-utils';

describe('LocalSave - Integration behavior', { tags: ['integration'] }, () => {
    test('should fail to retrieve data with a wrong encryption key', async () => {
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
        await writerLocalSave.destroy();
        await readerLocalSave.destroy();
        debugLog('>> End of test for LocalSave get method with wrong encryption key <<');
    });
    test('should clear data on decryption error when clearOnDecryptError is true', async () => {
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
        await writerLocalSave.destroy();
        await readerLocalSave.destroy();
        debugLog(
            '>> End of test for LocalSave get method with wrong encryption key and clearOnDecryptError set to true <<',
        );
    });
});

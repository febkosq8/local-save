import LocalSave from '@local-save/index';
import { createObjectWithRandomValues, debugLog, isDebugLogsEnabled, randomString } from '@local-save/test/test-utils';

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
                encryptionKey: '68EW1X83TCNO46AQMMDMDZ365DBX6PU1',
                clearOnDecryptError: true,
                printLogs: isDebugLogsEnabled(),
            });
            const secondaryLocalSave = new LocalSave({
                encryptionKey: '68PCSEY3FVR666A8IR378ODGEW1T3I68',
                clearOnDecryptError: true,
                printLogs: isDebugLogsEnabled(),
            });
            await primaryLocalSave.set('userData', randomKey, randomData);
            await expect(secondaryLocalSave.get('userData', randomKey)).rejects.toThrow('Data decryption failed');
            const keysAfterError = await primaryLocalSave.listKeys('userData');
            debugLog(`Expected keys after decryption error: []\nActual keys: ${JSON.stringify(keysAfterError)}`);
            expect(keysAfterError).toEqual([]);
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
});

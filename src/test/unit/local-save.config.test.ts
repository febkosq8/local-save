import LocalSave from '@local-save/index';
import { debugLog } from '@local-save/test/test-utils';
import LocalSaveConfigError from '@local-save/utils/errors/LocalSaveConfigError';

describe('LocalSave - Constructor', { tags: ['config'] }, ({ beforeEach, afterEach }) => {
    beforeEach(({ task: { fullTestName } }) => {
        console.log(`>>> Starting run - [ ${fullTestName} ] <<<`);
        vi.restoreAllMocks();
    });
    afterEach(({ task: { fullTestName } }) => {
        console.log(`<<< Finished run - [ ${fullTestName} ] >>>`);
    });
    test('should use default configuration values', ({ expect }) => {
        const localSave = new LocalSave();
        debugLog(`Validating property 'dbName'\nExpected: LocalSave\nActual: ${localSave.dbName}`);
        expect(localSave.dbName).toBe('LocalSave');
        debugLog(`Validating property 'encryptionKey'\nExpected: undefined\nActual: ${localSave.encryptionKey}`);
        expect(localSave.encryptionKey).toBeUndefined();
        debugLog(
            `Validating property 'categories'\nExpected: ["userData"]\nActual: ${JSON.stringify(localSave.categories)}`,
        );
        expect(localSave.categories).toEqual(['userData']);
        debugLog(`Validating property 'expiryThreshold'\nExpected: 30\nActual: ${localSave.expiryThreshold}`);
        expect(localSave.expiryThreshold).toBe(30);
        debugLog(`Validating property 'clearOnDecryptError'\nExpected: true\nActual: ${localSave.clearOnDecryptError}`);
        expect(localSave.clearOnDecryptError).toBe(true);
        debugLog(`Validating property 'printLogs'\nExpected: false\nActual: ${localSave.printLogs}`);
        expect(localSave.printLogs).toBe(false);
    });

    test('should apply provided configuration values', () => {
        const localSave = new LocalSave({
            dbName: 'CustomDb',
            encryptionKey: '75Q1SDWH1B6KJIP6',
            categories: ['session', 'cache'],
            clearOnDecryptError: false,
            expiryThreshold: 7,
            blockedTimeoutThreshold: 15000,
            printLogs: true,
        });
        debugLog(`Validating property 'dbName'\nExpected: CustomDb\nActual: ${localSave.dbName}`);
        expect(localSave.dbName).toBe('CustomDb');
        debugLog(`Validating property 'encryptionKey'\nExpected: 75Q1SDWH1B6KJIP6\nActual: ${localSave.encryptionKey}`);
        expect(localSave.encryptionKey).toBe('75Q1SDWH1B6KJIP6');
        debugLog(
            `Validating property 'categories'\nExpected: ["session", "cache"]\nActual: ${JSON.stringify(localSave.categories)}`,
        );
        expect(localSave.categories).toEqual(['session', 'cache']);
        debugLog(`Validating property 'expiryThreshold'\nExpected: 7\nActual: ${localSave.expiryThreshold}`);
        expect(localSave.expiryThreshold).toBe(7);
        debugLog(
            `Validating property 'clearOnDecryptError'\nExpected: false\nActual: ${localSave.clearOnDecryptError}`,
        );
        expect(localSave.clearOnDecryptError).toBe(false);
        debugLog(
            `Validating property 'blockedTimeoutThreshold'\nExpected: 15000\nActual: ${localSave.blockedTimeoutThreshold}`,
        );
        expect(localSave.blockedTimeoutThreshold).toBe(15000);
        debugLog(`Validating property 'printLogs'\nExpected: true\nActual: ${localSave.printLogs}`);
        expect(localSave.printLogs).toBe(true);
    });

    test('should not throw error when config values are valid', () => {
        let thrownError: unknown;
        let localSave: LocalSave | undefined;
        try {
            localSave = new LocalSave({
                encryptionKey: 'FXSVGSVFX5KE6LSTZU535JC0H6OXY4KI',
                expiryThreshold: 15,
                blockedTimeoutThreshold: 20000,
            });
        } catch (error) {
            thrownError = error;
        }
        debugLog(`Validating error\nExpected: undefined\nActual: ${String(thrownError)}`);
        expect(thrownError).toBeUndefined();
        expect(localSave?.encryptionKey).toBe('FXSVGSVFX5KE6LSTZU535JC0H6OXY4KI');
        expect(localSave?.expiryThreshold).toBe(15);
        expect(localSave?.blockedTimeoutThreshold).toBe(20000);
    });

    test('should throw error when encryption key length is invalid', () => {
        let thrownError: unknown;

        try {
            new LocalSave({
                encryptionKey: '75Q1SDWH1B6KJIP6RO5MPSFYF2V2CG',
            });
        } catch (error) {
            thrownError = error;
        }
        debugLog(
            `Validating error\nExpected: LocalSaveConfigError: Encryption key should be of length 16, 24, or 32 characters\nActual: ${String(thrownError)}`,
        );
        expect(thrownError).toBeInstanceOf(LocalSaveConfigError);
        if (thrownError instanceof LocalSaveConfigError) {
            expect(thrownError.message).toBe('Encryption key should be of length 16, 24, or 32 characters');
        }
    });

    test('should throw error when expiryThreshold is not a positive number', () => {
        let thrownError: unknown;
        try {
            new LocalSave({
                expiryThreshold: 0,
            });
        } catch (error) {
            thrownError = error;
        }
        debugLog(
            `Validating error\nExpected: LocalSaveConfigError: expiryThreshold should be a positive number\nActual: ${String(thrownError)}`,
        );
        expect(thrownError).toBeInstanceOf(LocalSaveConfigError);
        if (thrownError instanceof LocalSaveConfigError) {
            expect(thrownError.message).toBe('expiryThreshold should be a positive number');
        }
    });

    test('should throw error when blockedTimeoutThreshold is not a positive number', () => {
        let thrownError: unknown;
        try {
            new LocalSave({
                blockedTimeoutThreshold: 0,
            });
        } catch (error) {
            thrownError = error;
        }
        debugLog(
            `Validating error\nExpected: LocalSaveConfigError: blockedTimeoutThreshold should be a positive number\nActual: ${String(thrownError)}`,
        );
        expect(thrownError).toBeInstanceOf(LocalSaveConfigError);
        if (thrownError instanceof LocalSaveConfigError) {
            expect(thrownError.message).toBe('blockedTimeoutThreshold should be a positive number');
        }
    });
});

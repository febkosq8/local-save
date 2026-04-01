import LocalSave from '@local-save/index';
import { debugLog } from '@local-save/test/test-utils';
import Logger from '@local-save/utils/logger';

describe('LocalSave - Constructor', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    it('should use default configuration values', () => {
        const localSave = new LocalSave();
        debugLog('>> Testing LocalSave constructor with default configuration values');
        debugLog(`> Testing dbName\nExpected: LocalSave\nActual: ${localSave.dbName}`);
        expect(localSave.dbName).toBe('LocalSave');
        debugLog(`> Testing encryptionKey\nExpected: undefined\nActual: ${localSave.encryptionKey}`);
        expect(localSave.encryptionKey).toBeUndefined();
        debugLog(`> Testing categories\nExpected: ["userData"]\nActual: ${JSON.stringify(localSave.categories)}`);
        expect(localSave.categories).toEqual(['userData']);
        debugLog(`> Testing expiryThreshold\nExpected: 30\nActual: ${localSave.expiryThreshold}`);
        expect(localSave.expiryThreshold).toBe(30);
        debugLog(`> Testing clearOnDecryptError\nExpected: true\nActual: ${localSave.clearOnDecryptError}`);
        expect(localSave.clearOnDecryptError).toBe(true);
        debugLog(`> Testing printLogs\nExpected: false\nActual: ${localSave.printLogs}`);
        expect(localSave.printLogs).toBe(false);
        debugLog(`>> End of test for LocalSave constructor with default configuration values <<`);
    });

    it('should apply provided configuration values', () => {
        const localSave = new LocalSave({
            dbName: 'CustomDb',
            encryptionKey: '75Q1SDWH1B6KJIP6',
            categories: ['session', 'cache'],
            expiryThreshold: 7,
            clearOnDecryptError: false,
            printLogs: true,
        });
        debugLog('>> Testing LocalSave constructor with provided configuration values');
        debugLog(`> Testing dbName\nExpected: CustomDb\nActual: ${localSave.dbName}`);
        expect(localSave.dbName).toBe('CustomDb');
        debugLog(`> Testing encryptionKey\nExpected: 75Q1SDWH1B6KJIP6\nActual: ${localSave.encryptionKey}`);
        expect(localSave.encryptionKey).toBe('75Q1SDWH1B6KJIP6');
        debugLog(
            `> Testing categories\nExpected: ["session", "cache"]\nActual: ${JSON.stringify(localSave.categories)}`,
        );
        expect(localSave.categories).toEqual(['session', 'cache']);
        debugLog(`> Testing expiryThreshold\nExpected: 7\nActual: ${localSave.expiryThreshold}`);
        expect(localSave.expiryThreshold).toBe(7);
        debugLog(`> Testing clearOnDecryptError\nExpected: false\nActual: ${localSave.clearOnDecryptError}`);
        expect(localSave.clearOnDecryptError).toBe(false);
        debugLog(`> Testing printLogs\nExpected: true\nActual: ${localSave.printLogs}`);
        expect(localSave.printLogs).toBe(true);
        debugLog(`>> End of test for LocalSave constructor with provided configuration values <<`);
    });

    it('should warn once when encryption key length is invalid', () => {
        const warnSpy = vi.spyOn(Logger, 'warn');
        debugLog('>> Testing LocalSave constructor with invalid encryption key length');
        debugLog('> Expecting a warning about invalid encryption key length of 30 characters');
        new LocalSave({
            encryptionKey: '75Q1SDWH1B6KJIP6RO5MPSFYF2V2CG',
        });
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith('Encryption key should be of length 16, 24, or 32 characters', {
            keyLength: 30,
        });
        debugLog(`>> End of test for LocalSave constructor with invalid encryption key length <<`);
    });

    it('should not warn when encryption key length is valid', () => {
        const warnSpy = vi.spyOn(Logger, 'warn');
        debugLog('>> Testing LocalSave constructor with valid encryption key length');
        debugLog('> Expecting no warnings about encryption key length of 32 characters');
        new LocalSave({
            encryptionKey: 'FXSVGSVFX5KE6LSTZU535JC0H6OXY4KI',
        });
        expect(warnSpy).not.toHaveBeenCalled();
        debugLog(`>> End of test for LocalSave constructor with valid encryption key length <<`);
    });
});

import { debugLog } from '@local-save/test/setup';
import LocalSaveConfigError from '@local-save/utils/errors/LocalSaveConfigError';
import LocalSaveEncryptionKeyError from '@local-save/utils/errors/LocalSaveEncryptionKeyError';
import LocalSaveError from '@local-save/utils/errors/LocalSaveError';
import Logger from '@local-save/utils/logger';
import {
    arrayBufferToBase64,
    base64ToArrayBuffer,
    isEncryptionKeyDefined,
    isValidEncryptionKey,
} from '@local-save/utils/utils';

describe('Utils - isEncryptionKeyDefined', { tags: ['utils'] }, ({ beforeEach, afterEach }) => {
    beforeEach(({ task: { fullTestName } }) => {
        debugLog(`>>> Starting run - [ ${fullTestName} ] <<<`);
    });
    afterEach(({ task: { fullTestName } }) => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        debugLog(`<<< Finished run - [ ${fullTestName} ] >>>`);
    });

    test('should return false when key is undefined', { tags: ['utils'] }, ({ expect }) => {
        const result = isEncryptionKeyDefined(undefined);
        debugLog(`Expected: false\nActual: ${result}`);
        expect(result).toBe(false);
    });

    test('should return false when key is null', { tags: ['utils'] }, ({ expect }) => {
        const result = isEncryptionKeyDefined(null);
        debugLog(`Expected: false\nActual: ${result}`);
        expect(result).toBe(false);
    });

    test('should return false when key is an empty string', { tags: ['utils'] }, ({ expect }) => {
        const result = isEncryptionKeyDefined('');
        debugLog(`Expected: false\nActual: ${result}`);
        expect(result).toBe(false);
    });

    test('should return true when key is a non-empty string', { tags: ['utils'] }, ({ expect }) => {
        const result = isEncryptionKeyDefined('abc');
        debugLog(`Expected: true\nActual: ${result}`);
        expect(result).toBe(true);
    });
});
describe('Utils - isValidEncryptionKey', { tags: ['utils'] }, ({ beforeEach, afterEach }) => {
    beforeEach(({ task: { fullTestName } }) => {
        debugLog(`>>> Starting run - [ ${fullTestName} ] <<<`);
    });
    afterEach(({ task: { fullTestName } }) => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        debugLog(`<<< Finished run - [ ${fullTestName} ] >>>`);
    });

    test('should return true if the key length is 16', { tags: ['utils'] }, ({ expect }) => {
        const key = 'RDN3TLL4D7M5Q59S';
        const result = isValidEncryptionKey(key);
        debugLog(`Expected: true\nActual: ${result}`);
        expect(result).toBe(true);
    });

    test('should return true when key length is 24', { tags: ['utils'] }, ({ expect }) => {
        const key = 'GGLE0LX78HY50AT2I5NAZT2Q';
        const result = isValidEncryptionKey(key);
        debugLog(`Expected: true\nActual: ${result}`);
        expect(result).toBe(true);
    });

    test('should return true when key length is 32', { tags: ['utils'] }, ({ expect }) => {
        const key = '8H2HDLU3OCF2M77LFHOD4YFH6ZKLWEOE';
        const result = isValidEncryptionKey(key);
        debugLog(`Expected: true\nActual: ${result}`);
        expect(result).toBe(true);
    });

    it.each([0, 2, 15, 33])('should return false when key length is %s', (length) => {
        const key = 'x'.repeat(length);
        const result = isValidEncryptionKey(key);
        debugLog(`Expected: false\nActual: ${result}`);
        expect(result).toBe(false);
    });

    test('should return false when key contains whitespace', { tags: ['utils'] }, ({ expect }) => {
        const key = 'RDN3TLL4 D7M5Q59S';
        const result = isValidEncryptionKey(key);
        debugLog(`Expected: false\nActual: ${result}`);
        expect(result).toBe(false);
    });
});
describe('Utils - ArrayBuffer and Base64 Conversion', { tags: ['utils'] }, ({ beforeEach, afterEach }) => {
    beforeEach(({ task: { fullTestName } }) => {
        debugLog(`>>> Starting run - [ ${fullTestName} ] <<<`);
    });
    afterEach(({ task: { fullTestName } }) => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        debugLog(`<<< Finished run - [ ${fullTestName} ] >>>`);
    });

    test('should convert an ArrayBuffer to a Base64 encoded string', { tags: ['utils'] }, ({ expect }) => {
        const buffer = new ArrayBuffer(16);
        const base64 = arrayBufferToBase64(buffer);
        debugLog(`Expected: A Base64 string of length 24\nActual: ${base64} (length: ${base64.length})`);
        expect(base64).toBe('AAAAAAAAAAAAAAAAAAAAAA==');
    });
    test('should convert a Base64 encoded string to an ArrayBuffer', { tags: ['utils'] }, ({ expect }) => {
        const base64 = 'AAAAAAAAAAAAAAAAAAAAAA==';
        const buffer = base64ToArrayBuffer(base64);
        debugLog(
            `> Expected: An ArrayBuffer with byteLength of 16\nActual: An ArrayBuffer with byteLength of ${buffer.byteLength}`,
        );
        expect(buffer.byteLength).toBe(16);
    });
    test('should preserve bytes when converting ArrayBuffer to Base64 and back', { tags: ['utils'] }, ({ expect }) => {
        const original = new Uint8Array([0, 1, 2, 127, 128, 254, 255]);
        const base64 = arrayBufferToBase64(original.buffer);
        const converted = new Uint8Array(base64ToArrayBuffer(base64));
        debugLog(
            `> Original bytes: ${Array.from(original)
                .map((b) => `0x${b.toString(16).padStart(2, '0')}`)
                .join(', ')}\nConverted bytes: ${Array.from(converted)
                .map((b) => `0x${b.toString(16).padStart(2, '0')}`)
                .join(', ')}`,
        );

        expect(Array.from(converted)).toEqual(Array.from(original));
    });
});

describe('Utils - Errors', { tags: ['utils'] }, ({ beforeEach, afterEach }) => {
    beforeEach(({ task: { fullTestName } }) => {
        debugLog(`>>> Starting run - [ ${fullTestName} ] <<<`);
    });
    afterEach(({ task: { fullTestName } }) => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        debugLog(`<<< Finished run - [ ${fullTestName} ] >>>`);
    });

    test('should set LocalSaveError name and message', { tags: ['utils'] }, ({ expect }) => {
        const error = new LocalSaveError('test message');
        debugLog(`Expected name: LocalSaveError\nActual name: ${error.name}`);
        debugLog(`Is instance of Error: ${error instanceof Error}`);
        debugLog(`Expected message: test message\nActual message: ${error.message}`);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('LocalSaveError');
        expect(error.message).toBe('test message');
    });

    test('should set LocalSaveConfigError name and message', { tags: ['utils'] }, ({ expect }) => {
        const error = new LocalSaveConfigError('test message');
        debugLog(`Expected name: LocalSaveConfigError\nActual name: ${error.name}`);
        debugLog(`Is instance of Error: ${error instanceof Error}`);
        debugLog(`Expected message: test message\nActual message: ${error.message}`);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('LocalSaveConfigError');
        expect(error.message).toBe('test message');
    });

    test('should set LocalSaveEncryptionKeyError name and message', { tags: ['utils'] }, ({ expect }) => {
        const error = new LocalSaveEncryptionKeyError('test message');
        debugLog(`Expected name: LocalSaveEncryptionKeyError\nActual name: ${error.name}`);
        debugLog(`Is instance of Error: ${error instanceof Error}`);
        debugLog(`Expected message: test message\nActual message: ${error.message}`);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('LocalSaveEncryptionKeyError');
        expect(error.message).toBe('test message');
    });

    test('should preserve cause when provided in options', { tags: ['utils'] }, ({ expect }) => {
        const cause = new Error('root cause');
        const error = new LocalSaveError('test message', { cause });
        const actualCauseMessage = error.cause instanceof Error ? error.cause.message : undefined;
        debugLog(`Expected cause message: root cause\nActual cause message: ${actualCauseMessage}`);
        expect(error.cause).toBe(cause);
    });
});

describe('Utils - Logger', { tags: ['utils'] }, ({ beforeEach, afterEach }) => {
    beforeEach(({ task: { fullTestName } }) => {
        debugLog(`>>> Starting run - [ ${fullTestName} ] <<<`);
    });
    afterEach(({ task: { fullTestName } }) => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        debugLog(`<<< Finished run - [ ${fullTestName} ] >>>`);
    });

    test('should throw an error if Logger class is instantiated', { tags: ['utils'] }, ({ expect }) => {
        expect(() => {
            new Logger();
        }).toThrow('This class cannot be instantiated.');
    });

    it.each([
        ['log', 'LOG'] as const,
        ['warn', 'WARN'] as const,
        ['error', 'ERROR'] as const,
        ['info', 'INFO'] as const,
        ['debug', 'DEBUG'] as const,
    ])('should call console.%s with LocalSave prefix and pass through args', (method, prefix) => {
        const consoleMock = vi.spyOn(console, method);
        Logger[method](`Message for ${method}`, { data: 'maybe' });
        expect(consoleMock).toHaveBeenCalledWith(`[LocalSave | ${prefix}] Message for ${method}\n`, { data: 'maybe' });
        consoleMock.mockRestore();
    });
});

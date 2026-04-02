import { debugLog } from '@local-save/test/test-utils';
import LocalSaveEncryptionKeyError from '@local-save/utils/errors/LocalSaveEncryptionKeyError';
import LocalSaveError from '@local-save/utils/errors/LocalSaveError';
import Logger from '@local-save/utils/logger';
import {
    arrayBufferToBase64,
    base64ToArrayBuffer,
    isEncryptionKeyDefined,
    isValidEncryptionKey,
} from '@local-save/utils/utils';

describe('Utils - isEncryptionKeyDefined', { tags: ['utils'] }, () => {
    test('should return false when key is undefined', () => {
        debugLog(`>> Testing isEncryptionKeyDefined with 'undefined' key`);
        const result = isEncryptionKeyDefined(undefined);
        debugLog(`> Expected: false\nActual: ${result}`);
        expect(result).toBe(false);
        debugLog(`>> End of test for isEncryptionKeyDefined with 'undefined' key <<`);
    });

    test('should return false when key is null', () => {
        debugLog(">> Testing isEncryptionKeyDefined with 'null' key");
        const result = isEncryptionKeyDefined(null);
        debugLog(`> Expected: false\nActual: ${result}`);
        expect(result).toBe(false);
        debugLog(`>> End of test for isEncryptionKeyDefined with 'null' key <<`);
    });

    test('should return false when key is an empty string', () => {
        debugLog(">> Testing isEncryptionKeyDefined with '<empty string>' key");
        const result = isEncryptionKeyDefined('');
        debugLog(`> Expected: false\nActual: ${result}`);
        expect(result).toBe(false);
        debugLog(`>> End of test for isEncryptionKeyDefined with '<empty string>' key <<`);
    });

    test('should return true when key is a non-empty string', () => {
        debugLog(">> Testing isEncryptionKeyDefined with '<non-empty string>' key");
        const result = isEncryptionKeyDefined('abc');
        debugLog(`> Expected: true\nActual: ${result}`);
        expect(result).toBe(true);
        debugLog(`>> End of test for isEncryptionKeyDefined with '<non-empty string>' key <<`);
    });
});
describe('Utils - isValidEncryptionKey', { tags: ['utils'] }, () => {
    test('should return true if the key length is 16', () => {
        debugLog('>> Testing isValidEncryptionKey with valid key lengths of 16 characters');
        const key = 'RDN3TLL4D7M5Q59S';
        const result = isValidEncryptionKey(key);
        debugLog(`> Expected: true\nActual: ${result}`);
        expect(result).toBe(true);
        debugLog('>> End of test for isValidEncryptionKey with valid key lengths of 16 characters <<');
    });

    test('should return true when key length is 24', () => {
        debugLog('>> Testing isValidEncryptionKey with valid key lengths of 24 characters');
        const key = 'GGLE0LX78HY50AT2I5NAZT2Q';
        const result = isValidEncryptionKey(key);
        debugLog(`> Expected: true\nActual: ${result}`);
        expect(result).toBe(true);
        debugLog('>> End of test for isValidEncryptionKey with valid key lengths of 24 characters <<');
    });

    test('should return true when key length is 32', () => {
        debugLog('>> Testing isValidEncryptionKey with valid key lengths of 32 characters');
        const key = '8H2HDLU3OCF2M77LFHOD4YFH6ZKLWEOE';
        const result = isValidEncryptionKey(key);
        debugLog(`> Expected: true\nActual: ${result}`);
        expect(result).toBe(true);
        debugLog('>> End of test for isValidEncryptionKey with valid key lengths of 32 characters <<');
    });

    it.each([0, 2, 15, 33])('should return false when key length is %s', (length) => {
        debugLog(`>> Testing isValidEncryptionKey with invalid key length of ${length} characters`);
        const key = 'x'.repeat(length);
        const result = isValidEncryptionKey(key);
        debugLog(`> Expected: false\nActual: ${result}`);
        expect(result).toBe(false);
        debugLog(`>> End of test for isValidEncryptionKey with invalid key length of ${length} characters <<`);
    });
});
describe('Utils - arrayBuffer <---> Base64', { tags: ['utils'] }, () => {
    test('should convert an ArrayBuffer to a Base64 encoded string', () => {
        debugLog('>> Testing arrayBufferToBase64 with a 16-byte ArrayBuffer');
        const buffer = new ArrayBuffer(16);
        const base64 = arrayBufferToBase64(buffer);
        debugLog(`> Expected: A Base64 string of length 24\nActual: ${base64} (length: ${base64.length})`);
        expect(base64).toBe('AAAAAAAAAAAAAAAAAAAAAA==');
        debugLog('>> End of test for arrayBufferToBase64 with a 16-byte ArrayBuffer <<');
    });
    test('should convert a Base64 encoded string to an ArrayBuffer', () => {
        debugLog('>> Testing base64ToArrayBuffer with a valid Base64 string');
        const base64 = 'AAAAAAAAAAAAAAAAAAAAAA==';
        const buffer = base64ToArrayBuffer(base64);
        debugLog(
            `> Expected: An ArrayBuffer with byteLength of 16\nActual: An ArrayBuffer with byteLength of ${buffer.byteLength}`,
        );
        expect(buffer.byteLength).toBe(16);
        debugLog('>> End of test for base64ToArrayBuffer with a valid Base64 string <<');
    });
    test('should preserve bytes when converting ArrayBuffer to Base64 and back', () => {
        debugLog('>> Testing that converting an ArrayBuffer to Base64 and back preserves the original bytes');
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
        debugLog('>> End of test for preserving bytes when converting ArrayBuffer to Base64 and back <<');
    });
});

describe('Utils - Errors', { tags: ['utils'] }, () => {
    test('should set LocalSaveError name and message', () => {
        debugLog('>> Testing LocalSaveError class instantiation and properties');
        const error = new LocalSaveError('test message');
        debugLog(`> Expected name: LocalSaveError\nActual name: ${error.name}`);
        debugLog(`> Is instance of Error: ${error instanceof Error}`);
        debugLog(`> Expected message: test message\nActual message: ${error.message}`);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('LocalSaveError');
        expect(error.message).toBe('test message');
        debugLog('>> End of test for LocalSaveError class instantiation and properties <<');
    });

    test('should set LocalSaveEncryptionKeyError name and message', () => {
        debugLog('>> Testing LocalSaveEncryptionKeyError class instantiation and properties');
        const error = new LocalSaveEncryptionKeyError('test message');
        debugLog(`> Expected name: LocalSaveEncryptionKeyError\nActual name: ${error.name}`);
        debugLog(`> Is instance of Error: ${error instanceof Error}`);
        debugLog(`> Expected message: test message\nActual message: ${error.message}`);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('LocalSaveEncryptionKeyError');
        expect(error.message).toBe('test message');
        debugLog('>> End of test for LocalSaveEncryptionKeyError class instantiation and properties <<');
    });

    test('should preserve cause when provided in options', () => {
        debugLog('>> Testing that LocalSaveError preserves the cause when provided in options');
        const cause = new Error('root cause');
        const error = new LocalSaveError('test message', { cause });
        const actualCauseMessage = error.cause instanceof Error ? error.cause.message : undefined;
        debugLog(`> Expected cause message: root cause\nActual cause message: ${actualCauseMessage}`);
        expect(error.cause).toBe(cause);
        debugLog('>> End of test for LocalSaveError cause preservation <<');
    });
});

describe('Utils - Logger', { tags: ['utils'] }, () => {
    test('should throw an error if Logger class is instantiated', () => {
        debugLog('>> Testing that instantiating Logger class throws an error');
        expect(() => {
            new Logger();
        }).toThrow('This class cannot be instantiated.');
        debugLog('>> End of test for Logger class instantiation error <<');
    });

    it.each([
        ['log', 'LOG'] as const,
        ['warn', 'WARN'] as const,
        ['error', 'ERROR'] as const,
        ['info', 'INFO'] as const,
        ['debug', 'DEBUG'] as const,
    ])('should call console.%s with LocalSave prefix and pass through args', (method, prefix) => {
        debugLog(`>> Testing Logger.${method} method calls console.${method} with correct prefix and arguments`);
        const consoleMock = vi.spyOn(console, method);
        Logger[method](`Message for ${method}`, { data: 'maybe' });
        expect(consoleMock).toHaveBeenCalledWith(`[LocalSave | ${prefix}] Message for ${method}\n`, { data: 'maybe' });
        consoleMock.mockRestore();
        debugLog(`>> End of test for Logger.${method} <<`);
    });
});

import LocalSaveEncryptionKeyError from '@local-save/utils/errors/LocalSaveEncryptionKeyError';
import LocalSaveError from '@local-save/utils/errors/LocalSaveError';
import Logger from '@local-save/utils/logger';
import {
    arrayBufferToBase64,
    base64ToArrayBuffer,
    isEncryptionKeyDefined,
    isValidEncryptionKey,
} from '@local-save/utils/utils';

describe('Utils - isEncryptionKeyDefined', () => {
    it('should return false when key is undefined', () => {
        console.log(`>> Testing isEncryptionKeyDefined with 'undefined' key`);
        const result = isEncryptionKeyDefined(undefined);
        console.log(`> Expected: false\nActual: ${result}`);
        expect(result).toBe(false);
        console.log(`>> End of test for isEncryptionKeyDefined with 'undefined' key <<`);
    });

    it('should return false when key is null', () => {
        console.log(">> Testing isEncryptionKeyDefined with 'null' key");
        const result = isEncryptionKeyDefined(null);
        console.log(`> Expected: false\nActual: ${result}`);
        expect(result).toBe(false);
        console.log(`>> End of test for isEncryptionKeyDefined with 'null' key <<`);
    });

    it('should return false when key is an empty string', () => {
        console.log(">> Testing isEncryptionKeyDefined with '<empty string>' key");
        const result = isEncryptionKeyDefined('');
        console.log(`> Expected: false\nActual: ${result}`);
        expect(result).toBe(false);
        console.log(`>> End of test for isEncryptionKeyDefined with '<empty string>' key <<`);
    });

    it('should return true when key is a non-empty string', () => {
        console.log(">> Testing isEncryptionKeyDefined with '<non-empty string>' key");
        const result = isEncryptionKeyDefined('abc');
        console.log(`> Expected: true\nActual: ${result}`);
        expect(result).toBe(true);
        console.log(`>> End of test for isEncryptionKeyDefined with '<non-empty string>' key <<`);
    });
});
describe('Utils - isValidEncryptionKey', () => {
    it('should return true if the key length is 16', () => {
        console.log('>> Testing isValidEncryptionKey with valid key lengths of 16 characters');
        const key = 'RDN3TLL4D7M5Q59S';
        const result = isValidEncryptionKey(key);
        console.log(`> Expected: true\nActual: ${result}`);
        expect(result).toBe(true);
        console.log('>> End of test for isValidEncryptionKey with valid key lengths of 16 characters <<');
    });

    it('should return true when key length is 24', () => {
        console.log('>> Testing isValidEncryptionKey with valid key lengths of 24 characters');
        const key = 'GGLE0LX78HY50AT2I5NAZT2Q';
        const result = isValidEncryptionKey(key);
        console.log(`> Expected: true\nActual: ${result}`);
        expect(result).toBe(true);
        console.log('>> End of test for isValidEncryptionKey with valid key lengths of 24 characters <<');
    });

    it('should return true when key length is 32', () => {
        console.log('>> Testing isValidEncryptionKey with valid key lengths of 32 characters');
        const key = '8H2HDLU3OCF2M77LFHOD4YFH6ZKLWEOE';
        const result = isValidEncryptionKey(key);
        console.log(`> Expected: true\nActual: ${result}`);
        expect(result).toBe(true);
        console.log('>> End of test for isValidEncryptionKey with valid key lengths of 32 characters <<');
    });

    it.each([0, 2, 15, 33])('should return false when key length is %s', (length) => {
        console.log(`>> Testing isValidEncryptionKey with invalid key length of ${length} characters`);
        const key = 'x'.repeat(length);
        const result = isValidEncryptionKey(key);
        console.log(`> Expected: false\nActual: ${result}`);
        expect(result).toBe(false);
        console.log(`>> End of test for isValidEncryptionKey with invalid key length of ${length} characters <<`);
    });
});
describe('Utils - arrayBuffer <---> Base64', () => {
    it('should convert an ArrayBuffer to a Base64 encoded string', () => {
        console.log('>> Testing arrayBufferToBase64 with a 16-byte ArrayBuffer');
        const buffer = new ArrayBuffer(16);
        const base64 = arrayBufferToBase64(buffer);
        console.log(`> Expected: A Base64 string of length 24\nActual: ${base64} (length: ${base64.length})`);
        expect(base64).toBe('AAAAAAAAAAAAAAAAAAAAAA==');
        console.log('>> End of test for arrayBufferToBase64 with a 16-byte ArrayBuffer <<');
    });
    it('should convert a Base64 encoded string to an ArrayBuffer', () => {
        console.log('>> Testing base64ToArrayBuffer with a valid Base64 string');
        const base64 = 'AAAAAAAAAAAAAAAAAAAAAA==';
        const buffer = base64ToArrayBuffer(base64);
        console.log(
            `> Expected: An ArrayBuffer with byteLength of 16\nActual: An ArrayBuffer with byteLength of ${buffer.byteLength}`,
        );
        expect(buffer.byteLength).toBe(16);
        console.log('>> End of test for base64ToArrayBuffer with a valid Base64 string <<');
    });
    it('should preserve bytes when converting ArrayBuffer to Base64 and back', () => {
        console.log('>> Testing that converting an ArrayBuffer to Base64 and back preserves the original bytes');
        const original = new Uint8Array([0, 1, 2, 127, 128, 254, 255]);
        const base64 = arrayBufferToBase64(original.buffer);
        const converted = new Uint8Array(base64ToArrayBuffer(base64));
        console.log(
            `> Original bytes: ${Array.from(original)
                .map((b) => `0x${b.toString(16).padStart(2, '0')}`)
                .join(', ')}\nConverted bytes: ${Array.from(converted)
                .map((b) => `0x${b.toString(16).padStart(2, '0')}`)
                .join(', ')}`,
        );

        expect(Array.from(converted)).toEqual(Array.from(original));
        console.log('>> End of test for preserving bytes when converting ArrayBuffer to Base64 and back <<');
    });
});

describe('Utils - Errors', () => {
    it('should set LocalSaveError name and message', () => {
        console.log('>> Testing LocalSaveError class instantiation and properties');
        const error = new LocalSaveError('test message');
        console.log(`> Expected name: LocalSaveError\nActual name: ${error.name}`);
        console.log(`> Is instance of Error: ${error instanceof Error}`);
        console.log(`> Expected message: test message\nActual message: ${error.message}`);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('LocalSaveError');
        expect(error.message).toBe('test message');
        console.log('>> End of test for LocalSaveError class instantiation and properties <<');
    });

    it('should set LocalSaveEncryptionKeyError name and message', () => {
        console.log('>> Testing LocalSaveEncryptionKeyError class instantiation and properties');
        const error = new LocalSaveEncryptionKeyError('test message');
        console.log(`> Expected name: LocalSaveEncryptionKeyError\nActual name: ${error.name}`);
        console.log(`> Is instance of Error: ${error instanceof Error}`);
        console.log(`> Expected message: test message\nActual message: ${error.message}`);
        expect(error).toBeInstanceOf(Error);
        expect(error.name).toBe('LocalSaveEncryptionKeyError');
        expect(error.message).toBe('test message');
        console.log('>> End of test for LocalSaveEncryptionKeyError class instantiation and properties <<');
    });

    it('should preserve cause when provided in options', () => {
        console.log('>> Testing that LocalSaveError preserves the cause when provided in options');
        const cause = new Error('root cause');
        const error = new LocalSaveError('test message', { cause });
        const actualCauseMessage = error.cause instanceof Error ? error.cause.message : undefined;
        console.log(`> Expected cause message: root cause\nActual cause message: ${actualCauseMessage}`);
        expect(error.cause).toBe(cause);
        console.log('>> End of test for LocalSaveError cause preservation <<');
    });
});

describe('Utils - Logger', () => {
    it('should throw an error if Logger class is instantiated', () => {
        console.log('>> Testing that instantiating Logger class throws an error');
        expect(() => {
            new Logger();
        }).toThrow('This class cannot be instantiated.');
        console.log('>> End of test for Logger class instantiation error <<');
    });

    it.each([
        ['log', 'LOG'] as const,
        ['warn', 'WARN'] as const,
        ['error', 'ERROR'] as const,
        ['info', 'INFO'] as const,
        ['debug', 'DEBUG'] as const,
    ])('should call console.%s with LocalSave prefix and pass through args', (method, prefix) => {
        console.log(`>> Testing Logger.${method} method calls console.${method} with correct prefix and arguments`);
        const consoleMock = vi.spyOn(console, method);
        Logger[method](`Message for ${method}`, { data: 'maybe' });
        expect(consoleMock).toHaveBeenCalledWith(`[LocalSave | ${prefix}] Message for ${method}\n`, { data: 'maybe' });
        consoleMock.mockRestore();
        console.log(`>> End of test for Logger.${method} <<`);
    });
});

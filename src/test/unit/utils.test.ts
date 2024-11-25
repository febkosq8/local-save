import { arrayBufferToBase64, base64ToArrayBuffer, isValidEncryptionKey } from '@local-save/utils/utils';

describe('Utils', () => {
    describe('isValidEncryptionKey', () => {
        it('should return true if the key length is valid', () => {
            const key = '1234567890123456';
            expect(isValidEncryptionKey(key)).toBe(true);
        });
        it('should return false if the key length is invalid', () => {
            const key = '123456789012345';
            expect(isValidEncryptionKey(key)).toBe(false);
        });
        it('should return false if the key length is 0', () => {
            const key = '';
            expect(isValidEncryptionKey(key)).toBe(false);
        });
    });
    describe('arrayBufferToBase64', () => {
        it('should convert an ArrayBuffer to a Base64 encoded string', () => {
            const buffer = new ArrayBuffer(16);
            const base64 = arrayBufferToBase64(buffer);
            expect(base64).toBe('AAAAAAAAAAAAAAAAAAAAAA==');
        });
    });
    describe('base64ToArrayBuffer', () => {
        it('should convert a Base64 encoded string to an ArrayBuffer', () => {
            const base64 = 'AAAAAAAAAAAAAAAAAAAAAA==';
            const buffer = base64ToArrayBuffer(base64);
            expect(buffer.byteLength).toBe(16);
        });
    });
});

import LocalSave from '@local-save/index';
import Logger from '@local-save/utils/logger';

describe('LocalSave', () => {
    it('should log a warning if the encryption key is invalid', () => {
        const loggerMock = vi.spyOn(Logger, 'warn');
        const key = '123456789012345';
        new LocalSave({
            encryptionKey: key,
        });
        expect(loggerMock).toHaveBeenCalledWith('Encryption key should be of length 16, 24, or 32 characters', {
            keyLength: key.length,
        });
    });
    describe('Not Encrypted', () => {
        it('should save and retrieve data', async () => {
            const localSave = new LocalSave();
            const data = { key: 'value' };
            await localSave.set('userData', 'key', data);
            const retrievedData = await localSave.get('userData', 'key');
            expect(retrievedData).toEqual(
                expect.objectContaining({
                    data: data,
                }),
            );
            await localSave.destroy();
        });
        it("should fail if trying to retrieve data that doesn't exist", async () => {
            const localSave = new LocalSave();
            const retrievedData = await localSave.get('userData', 'key');
            expect(retrievedData).toEqual(null);
        });
    });
});

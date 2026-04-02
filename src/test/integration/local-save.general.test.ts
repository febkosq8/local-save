import LocalSave from '@local-save/index';
import { debugLog } from '@local-save/test/test-utils';

describe('LocalSave - General integration behavior', { tags: ['integration'] }, () => {
    test('should create missing object stores when category exists in config', async () => {
        const dbName = 'LocalSaveStoreCreationCase';
        const localSave = new LocalSave({
            dbName,
            categories: ['userData', 'sessionData'],
        });

        await localSave.set('sessionData', 'session-key', { ok: true });
        const sessionData = await localSave.get('sessionData', 'session-key');

        expect(sessionData).toEqual(
            expect.objectContaining({
                data: { ok: true },
            }),
        );

        await localSave.destroy();
        debugLog('>> End of test for dynamic object store creation <<');
    });
});

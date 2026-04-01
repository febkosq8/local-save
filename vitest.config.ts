import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const enableTestLogs =
    (
        globalThis as typeof globalThis & {
            process?: {
                env?: Record<string, string | undefined>;
            };
        }
    ).process?.env?.LOCAL_SAVE_TEST_LOGS === '1';

export default defineConfig({
    define: {
        __LOCAL_SAVE_PRINT_TEST_LOGS__: JSON.stringify(enableTestLogs),
    },
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        include: ['src/test/**/*.test.ts'],
        name: 'local-save',
        globals: true,
        environment: 'jsdom',
        setupFiles: 'src/test/setup.ts',
        coverage: {
            reporter: ['text', 'json', 'html'],
        },
        silent: true,
        ui: true,
        testTimeout: 30 * 1000,
        browser: {
            provider: playwright(),
            enabled: true,
            headless: true,
            screenshotFailures: false,
            instances: [
                {
                    browser: 'chromium',
                },
            ],
        },
    },
});

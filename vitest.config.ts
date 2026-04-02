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
        tags: [
            {
                name: 'config',
                description: 'Tests for constructor and configuration behavior',
            },
            {
                name: 'instance',
                description: 'Tests for LocalSave instance methods',
            },
            {
                name: 'utils',
                description: 'Tests related to utility functions',
            },
            {
                name: 'integration',
                description: 'Integration tests that may involve multiple functions or components working together',
            },
        ],
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

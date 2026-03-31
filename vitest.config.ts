import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';
export default defineConfig({
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
        testTimeout: 30000,
        browser: {
            provider: playwright(),
            enabled: true,
            screenshotFailures: false,
            instances: [
                {
                    browser: 'chromium',
                },
            ],
        },
    },
});

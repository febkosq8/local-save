import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
export default defineConfig({
    plugins: [tsconfigPaths()],
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
            provider: 'playwright',
            enabled: true,
            screenshotFailures: false,
            instances: [
                {
                    browser: 'chromium',
                    launch: {
                        channel: 'chrome',
                    },
                },
            ],
        },
    },
});

declare const __LOCAL_SAVE_PRINT_TEST_LOGS__: boolean;

export const isTestLogsEnabled = __LOCAL_SAVE_PRINT_TEST_LOGS__;

export function debugLog(message?: unknown, ...optionalParams: unknown[]) {
    if (isTestLogsEnabled) {
        console.debug(message, ...optionalParams);
    }
}

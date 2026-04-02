declare const __LOCAL_SAVE_TEST_LOGS__: boolean;
declare const __LOCAL_SAVE_DEBUG_LOGS__: boolean;

export function isTestLogsEnabled(): boolean {
    return __LOCAL_SAVE_TEST_LOGS__;
}
export function isDebugLogsEnabled(): boolean {
    return __LOCAL_SAVE_DEBUG_LOGS__;
}

export function debugLog(message?: unknown, ...optionalParams: unknown[]) {
    if (isTestLogsEnabled()) {
        console.debug(message, ...optionalParams);
    }
}
export function randomString(length: number = 16): string {
    if (!Number.isInteger(length) || length < 0) {
        throw new Error('length should be a non-negative integer');
    }
    return Math.random()
        .toString(36)
        .slice(2, 2 + length);
}

export function createArrayWithRandomValues(length: number = 1): string[] {
    if (!Number.isInteger(length) || length < 0) {
        throw new Error('length should be a non-negative integer');
    }
    const result: string[] = [];
    for (let i = 0; i < length; i += 1) {
        result.push(randomString(12));
    }
    return result;
}

export function createObjectWithRandomValues(keyCount: number = 1): Record<string, string> {
    if (!Number.isInteger(keyCount) || keyCount < 0) {
        throw new Error('keyCount should be a non-negative integer');
    }
    const payload: Record<string, string> = {};
    for (let i = 1; i <= keyCount; i += 1) {
        payload[`key${i}`] = `value-${randomString(12)}`;
    }
    return payload;
}

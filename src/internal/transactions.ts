import type LocalSaveError from '@local-save/utils/errors/LocalSaveError';

/**
 * Wraps an IndexedDB request with transaction completion tracking.
 * Ensures the promise resolves/rejects only after the transaction settles.
 *
 * @param options Request and transaction handlers to track.
 * @param options.request IndexedDB request being tracked.
 * @param options.transaction IndexedDB transaction containing the request.
 * @param options.onRequestError Maps request-level errors to LocalSaveError.
 * @param options.onRequestError.error Request error payload.
 * @param options.onTransactionError Maps transaction-level errors to LocalSaveError.
 * @param options.onTransactionError.error Transaction error payload.
 * @param options.onTransactionAbort Maps transaction aborts to LocalSaveError.
 * @param options.onTransactionAbort.error Transaction abort error payload.
 * @param options.onTransactionComplete Optional callback executed after successful transaction completion.
 *
 * @returns {Promise<true>} A promise that resolves to `true` when the transaction completes successfully.
 *
 * @throws {LocalSaveError} Rejects when request, transaction error, or transaction abort handlers map failures.
 */
export function wrapRequestWithTransaction({
    request,
    transaction,
    onRequestError,
    onTransactionError,
    onTransactionAbort,
    onTransactionComplete,
}: {
    request: IDBRequest;
    transaction: IDBTransaction;
    onRequestError: (error: DOMException | null) => LocalSaveError;
    onTransactionError: (error: DOMException | null) => LocalSaveError;
    onTransactionAbort: (error: DOMException | null) => LocalSaveError;
    onTransactionComplete?: () => void;
}): Promise<true> {
    return new Promise<true>((resolve, reject) => {
        let settled = false;
        let requestError: LocalSaveError | undefined;

        const settleResolve = () => {
            if (settled) return;
            settled = true;
            resolve(true);
        };

        const settleReject = (error: LocalSaveError) => {
            if (settled) return;
            settled = true;
            reject(error);
        };

        request.addEventListener(
            'error',
            () => {
                requestError = onRequestError(request.error);
            },
            { once: true },
        );

        transaction.addEventListener(
            'complete',
            () => {
                if (settled) return;
                if (requestError) {
                    settleReject(requestError);
                    return;
                }
                onTransactionComplete?.();
                settleResolve();
            },
            { once: true },
        );

        transaction.addEventListener(
            'error',
            () => {
                if (settled) return;
                settleReject(requestError ?? onTransactionError(transaction.error));
            },
            { once: true },
        );

        transaction.addEventListener(
            'abort',
            () => {
                if (settled) return;
                settleReject(requestError ?? onTransactionAbort(transaction.error));
            },
            { once: true },
        );
    });
}

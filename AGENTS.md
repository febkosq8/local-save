# AGENTS.md: AI Coding Agent Instructions for local-save

# Project Context

- This repository is a TypeScript library (`@febkosq8/local-save`) focused on secure IndexedDB storage with optional AES-GCM encryption.
- Preserve the public API and behavior unless a change request explicitly requires a breaking update.
- Keep runtime dependencies at zero unless explicitly requested.

## Current Implementation Details (Source of Truth)

- Core implementation lives in `src/index.ts` in class `LocalSave`; preserve method signatures and return contracts.
- Default runtime config is:
    - `dbName: "LocalSave"`
    - `categories: ["userData"]`
    - `expiryThreshold: 30 * 24 * 60 * 60 * 1000` (ms)
    - `blockedTimeoutThreshold: 10000` (ms)
    - `clearOnDecryptError: true`
    - `printLogs: false`
    - `encryptionKey: undefined`
- Constructor validation behavior must be preserved:
    - encryption key must be non-whitespace and length `16 | 24 | 32`
    - `expiryThreshold` and `blockedTimeoutThreshold` must be finite positive numbers
    - invalid values throw `LocalSaveConfigError`
- Storage format behavior must be preserved:
    - without encryption, store `DBItem` object `{ timestamp, data }`
    - with encryption, store a base64 string containing `IV(12 bytes) + AES-GCM ciphertext`
- Encryption/decryption behavior must be preserved:
    - AES-GCM key import via `crypto.subtle.importKey("raw", ...)`
    - lazy encoder/decoder initialization and cached `CryptoKey` reuse for the same key source
    - decryption failures throw `LocalSaveError("Data decryption failed")`
- Category and store behavior must be preserved:
    - `getStore()` auto-creates missing object stores only when the category exists in configured `categories`
    - unknown category access rejects with `LocalSaveError`
    - `listCategories()` reflects actual object stores from IndexedDB
- Operation semantics to keep stable:
    - `set(category, key, data) -> Promise<true>`
    - `get(category, key) -> Promise<DBItem | null>`
    - `listKeys(category) -> Promise<string[]>`
    - `remove(category, key) -> Promise<true>`
    - `clear(category) -> Promise<true>`
    - `expire(thresholdMs?) -> Promise<true>` and rejects for non-positive/invalid `thresholdMs`
    - `destroy() -> Promise<true>`
- IndexedDB transaction behavior to preserve:
    - write methods resolve only after transaction completion (not just request success)
    - blocked open/delete operations use timeout based on `blockedTimeoutThreshold`
    - database connections are closed on transaction end and versionchange events
- `clearOnDecryptError` behavior is test-backed and must remain unchanged:
    - `true`: failed decrypt in `get()`/`expire()` clears affected category
    - `false`: failed decrypt does not clear category data
- Error classes are part of expected behavior and should remain meaningful and distinct:
    - `LocalSaveError`
    - `LocalSaveConfigError`
    - `LocalSaveEncryptionKeyError`

## Code Style and Scope

- Prefer small, targeted edits over broad refactors.
- Follow existing naming, file layout, and TypeScript patterns already used in `src/`.
- Avoid changing unrelated files or formatting outside the task scope.
- Keep comments concise and only where logic is not obvious.
- Use `pnpm` as the package manager for install, run, and script commands instead of `npm`.

## Documentation Expectations

- JSDoc is required for public API surface and non-trivial internal behavior; it is not optional.
- TypeScript typing discipline is required; avoid `any` unless there is a justified, documented reason.
- When refactoring or moving logic, preserve existing JSDoc intent and coverage in the new location.
- If a method has JSDoc, it must document all parameters with `@param`, including nested properties (for example `options.key`) when the parameter is an object.
- If a method has JSDoc, it must include an explicit typed `@returns` tag (for example `@returns {Promise<DBItem | null>}`) describing the resolved/returned type and meaning.
- If a method has JSDoc, it must include explicit `@throws` tags for the errors it can throw or reject with.
- If a method is private and has JSDoc, it must be marked with `@internal`.
- JSDoc tag blocks must use consistent spacing: insert one blank line between `@param` and `@returns`, and one blank line between `@returns` and `@throws`.

## Safety and API Expectations

- Validate and preserve behavior for:
    - `get()` returning `{ timestamp, data }` or `null`
    - `set()` returning `true` on success
    - category-aware operations (`set`, `get`, `listKeys`, `clear`, `remove`)
- Preserve encryption-path correctness and error handling (`clearOnDecryptError`, encryption key validation).
- Do not silently change default config behavior.
- Keep `expire()` logic category-wide and timestamp-driven (milliseconds threshold).
- Keep IndexedDB blocked timeout handling aligned between `openDB()` and `destroy()`.

## Testing Guidance

- Run tests with:

```bash
pnpm test
```

- This project uses browser-based Vitest + Playwright due to IndexedDB requirements.
- Prefer updating or adding tests when changing behavior in `src/`.
- Keep tests deterministic and clean up test artifacts (for instance, destroy created `LocalSave` instances).

## Build and Quality Checks

- Before finalizing substantial changes, run:

```bash
pnpm lint
pnpm test
pnpm build
```

- If only docs are changed, skip heavy checks unless explicitly requested.

## Demo App Guidance

- Treat `demo/` as a separate project with its own configuration, build pipeline, and dependencies.
- Keep library work scoped to `src/` unless demo changes are explicitly requested.
- Keep demo work scoped to `demo/` unless library changes are explicitly requested.
- The demo should demonstrate package usage and remain aligned with actual library behavior.
- Do not introduce demo-only behavior into library source.

## Pull Request Expectations

- Include concise change summaries.
- Call out behavior changes and migration impact explicitly.
- Mention test coverage updates when applicable.

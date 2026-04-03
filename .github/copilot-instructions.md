# Copilot Instructions for local-save

## Project Context

- This repository is a TypeScript library (`@febkosq8/local-save`) focused on secure IndexedDB storage with optional AES-GCM encryption.
- Preserve the public API and behavior unless a change request explicitly requires a breaking update.
- Keep runtime dependencies at zero unless explicitly requested.

## Code Style and Scope

- Prefer small, targeted edits over broad refactors.
- Follow existing naming, file layout, and TypeScript patterns already used in `src/`.
- Avoid changing unrelated files or formatting outside the task scope.
- Keep comments concise and only where logic is not obvious.

## Safety and API Expectations

- Validate and preserve behavior for:
    - `get()` returning `{ timestamp, data }` or `null`
    - `set()` returning `true` on success
    - category-aware operations (`set`, `get`, `listKeys`, `clear`, `remove`)
- Preserve encryption-path correctness and error handling (`clearOnDecryptError`, encryption key validation).
- Do not silently change default config behavior.

## Testing Guidance

- Run tests with:

```bash
npm run test
```

- This project uses browser-based Vitest + Playwright due to IndexedDB requirements.
- Prefer updating or adding tests when changing behavior in `src/`.
- Keep tests deterministic and clean up test artifacts (for instance, destroy created `LocalSave` instances).

## Build and Quality Checks

- Before finalizing substantial changes, run:

```bash
npm run lint
npm run test
npm run build
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

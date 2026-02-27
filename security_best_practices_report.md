# Security Best Practices Report

Executive summary:
- 1 high-severity dependency vulnerability in the build/runtime toolchain (`@astrojs/vercel` → `@vercel/routing-utils` → `path-to-regexp`).
- 2 low-severity client-side injection surfaces that are safe today only because content appears to be trusted.
- 1 hardening gap (no CSP visible in-repo; may be set at the edge but not verifiable here).

## High Severity

### H-1: Vulnerable dependency chain `@astrojs/vercel` → `@vercel/routing-utils` → `path-to-regexp`
- Rule ID: DEP-001
- Severity: High
- Location: `package.json:21`
- Evidence:
  - `@astrojs/vercel`: `^9.0.4` (`package.json:21`)
  - `npm audit` reports `path-to-regexp` ReDoS vulnerability (GHSA-9wv6-86v2-598j) via `@vercel/routing-utils`
- Impact: If affected routing utilities are used in runtime (e.g., edge/serverless), crafted inputs could cause excessive backtracking and degrade availability.
- Fix:
  - Prefer upgrading to a patched `@astrojs/vercel` once upstream ships a fix.
  - If no patched version exists, consider pinning to a non-vulnerable version (audit suggests `@astrojs/vercel@8.0.4`) or using overrides/resolutions to force a safe `path-to-regexp` once available.
- Mitigation:
  - If the site is fully static with no runtime routing utilities, exposure is reduced; still fix to avoid latent risk.
- False positive notes:
  - Verify whether `@vercel/routing-utils` is used at runtime in your deploy model.

## Low Severity

### L-2: `innerHTML` used for tooltips with dataset-driven strings
- Rule ID: JS-XSS-001
- Severity: Low
- Location:
  - `src/components/TravelMap.astro:587-592`
  - `src/components/TravelMap.astro:701-704`
- Evidence:
  - `tooltip.innerHTML = \`...\``
  - `note.title`, `note.note`, and marker dataset fields are interpolated into HTML.
- Impact: If any of these values ever become user-controlled (e.g., CMS/content pipeline), this becomes a DOM XSS sink.
- Fix:
  - Build DOM nodes and set `textContent` for title/note, or sanitize HTML with a trusted allowlist sanitizer if rich text is required.
- Mitigation:
  - Constrain content sources to trusted, static files only; avoid accepting HTML in data fields.
- False positive notes:
  - If all content is hard-coded and trusted, the current usage is low risk.

### L-3: Unvalidated iframe `src` from `data-embed-url`
- Rule ID: JS-URL-001
- Severity: Low
- Location: `src/pages/library/[slug].astro:540-555`
- Evidence:
  - `const url = embed.getAttribute('data-embed-url');`
  - `iframe.src = url;`
- Impact: If `data-embed-url` can be influenced by untrusted authors, it could embed malicious origins or phishing content.
- Fix:
  - Validate `url` against an explicit allowlist (e.g., `youtube.com`, `open.spotify.com`, etc.) before assigning to `iframe.src`.
- Mitigation:
  - Keep embed URLs sourced from trusted content only.
- False positive notes:
  - If only trusted maintainers can edit content, risk is low but still a best-practice gap.

## Hardening / Defense-in-Depth

### L-4: No Content Security Policy visible in-repo
- Rule ID: CSP-001
- Severity: Low
- Location: Not visible in repo (verify at edge/runtime)
- Evidence:
  - No CSP headers or `<meta http-equiv="Content-Security-Policy">` found in repo.
- Impact: Without a CSP, any XSS bug has fewer mitigations.
- Fix:
  - Configure CSP headers in Vercel (e.g., `vercel.json` headers) or via platform settings.
  - Avoid `unsafe-inline`/`unsafe-eval` to maximize protection.
- Mitigation:
  - If CSP is already set at the edge, document it for auditability.
- False positive notes:
  - This might already be configured outside the repo.

# Security Policy

## Supported version

Security fixes are applied to the latest source release.

## Reporting a vulnerability

Please report security issues privately through GitHub's security advisory flow for this repository rather than opening a public issue. Include reproduction steps, affected version/commit, impact, and any suggested mitigation.

## Security model

Caffeinate is intentionally local-only. The frontend cannot run arbitrary shell commands. Rust starts only `/usr/bin/caffeinate`, validates bounded timeout input, owns the child process, and cleans it up on stop or application exit. The project does not require API keys or network credentials.

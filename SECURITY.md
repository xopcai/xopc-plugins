# Security policy

Report vulnerabilities privately through GitHub Security Advisories. Never include real credentials or customer data in issues or test fixtures.

Packages declare MCP execution, account authorization and downloaded resources. Every runtime resource is mirrored on XOPC Store with a SHA-256 digest, platform and architecture. Installation verifies the selected digest before execution. No package may silently install a system-wide CLI, guess account ownership or import another application's credentials.

Secrets are entered locally in the installation/account editor and stored through XOPC credential references. Official CLIs retain their own private account storage. The local Gmail adapter encrypts its token file with a local private key in the account directory; this protects accidental plaintext disclosure, not another process with full access to the same user account. Credentials and OAuth tokens are never sent to Store.

Provider adapters use fixed provider domains, validated API paths and argument-array execution. External writes require the user's task intent; a successful installation grants no additional permission to send messages, publish sites or mutate business data.

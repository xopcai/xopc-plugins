# Security policy

Report vulnerabilities privately through GitHub Security Advisories for this repository. Do not include credentials or sensitive user data in a public issue.

Official plugins must not embed credentials, download executable code at runtime, or transmit user data unless their manifest declares a remote MCP endpoint. Local MCP plugins must use package-contained source or a well-known runtime command and keep all file access scoped to tool arguments explicitly supplied by the user.

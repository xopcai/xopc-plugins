# Cloudflare Workspace

Inspect and operate Cloudflare resources through Cloudflare’s official OAuth-enabled remote MCP server.

## Install

```bash
xopc extensions install store:cloudflare-workspace
```

The plugin installs disabled so its declared capabilities can be reviewed before enabling. On first use, XOPC opens the provider OAuth flow and completes setup after authorization.

## Included capability

- Skill: `cloudflare-workspace`
- Remote MCP: `cloudflare` at `https://mcp.cloudflare.com/mcp`

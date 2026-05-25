---
name: figma-mcp-setup
description: Set up the Figma MCP server for accessing Figma design files
---
## Figma MCP Server Setup

1. You need a Figma Personal Access Token:
   - Go to Figma Settings → Security → Personal Access Tokens
   - Generate a new token with at least "Read files" scope

2. The server is installed at `/tmp/figma-mcp-server/`

3. Create `.env` file with:
   ```
   FIGMA_API_KEY=your_token_here
   ```

4. Run with:
   ```bash
   bun /tmp/figma-mcp-server/mcpServer.ts
   ```

5. I'll register it as an MCP server so the tool can access Figma data

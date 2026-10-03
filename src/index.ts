import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createServer } from './server.js';

console.error('google-apps-script-mcp starting on stdio');

serveStdio(() => createServer());

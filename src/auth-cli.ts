import { config, redactPath } from './config.js';
import { loginInteractive } from './auth.js';

async function main() {
  console.error('Google Apps Script MCP OAuth setup');
  console.error(`OAuth client: ${redactPath(config.oauthClientFile)}`);
  console.error(`Token cache:  ${redactPath(config.oauthTokenFile)}`);

  await loginInteractive();

  console.error('\nAuthorization complete. The refresh token is stored locally.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

import fs from 'node:fs/promises';
import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
import {
  createDeployment,
  createProject,
  createVersion,
  deleteDeployment,
  getDeployment,
  getProject,
  getProjectContent,
  listDeployments,
  listVersions,
  updateDeployment,
  updateProjectContent,
  type AppsScriptFile,
} from './apps-script.js';
import { config, redactPath } from './config.js';
import { hasCachedToken } from './auth.js';
import {
  loadAppsScriptDirectory,
  summarizeFiles,
} from './project-files.js';

function result(value: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  };
}

function assertManifest(files: AppsScriptFile[]): void {
  const manifest = files.find(
    (file) => file.name === 'appsscript' && file.type === 'JSON',
  );
  if (!manifest) {
    throw new Error(
      'Apps Script content must include a JSON manifest file named "appsscript".',
    );
  }

  try {
    JSON.parse(manifest.source);
  } catch (error) {
    throw new Error('appsscript manifest source is not valid JSON.', {
      cause: error,
    });
  }
}

function remoteFileSummary(content: {
  files?: Array<{ name?: string | null; type?: string | null; source?: string | null }> | null;
}) {
  return (content.files ?? []).map((file) => ({
    name: file.name ?? '',
    type: file.type ?? '',
    characters: file.source?.length ?? 0,
  }));
}

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'google-apps-script-mcp',
    version: '0.1.0',
  });

  server.registerTool(
    'auth_status',
    {
      description:
        'Check whether local Google OAuth client configuration and cached user authorization are present. Never returns token contents.',
      inputSchema: z.object({}),
    },
    async () => {
      try {
        let clientFileExists = false;
        try {
          await fs.access(config.oauthClientFile);
          clientFileExists = true;
        } catch {
          // Missing OAuth client config.
        }

        return result({
          oauth_client_file: redactPath(config.oauthClientFile),
          oauth_client_file_exists: clientFileExists,
          oauth_token_file: redactPath(config.oauthTokenFile),
          oauth_token_cached: await hasCachedToken(),
          next_step: clientFileExists
            ? 'Run "npm run auth" if oauth_token_cached is false.'
            : 'Create a Google Cloud Desktop OAuth client and save its JSON at the oauth_client_file path.',
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'projects_create',
    {
      description:
        'Create a new Google Apps Script project. Omit parent_id for a standalone project.',
      inputSchema: z.object({
        title: z.string().min(1),
        parent_id: z.string().min(1).optional(),
      }),
    },
    async ({ title, parent_id }) => {
      try {
        return result(await createProject(title, parent_id));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'projects_get',
    {
      description: 'Get Google Apps Script project metadata by Script ID.',
      inputSchema: z.object({
        script_id: z.string().min(1),
      }),
    },
    async ({ script_id }) => {
      try {
        return result(await getProject(script_id));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'projects_get_content',
    {
      description:
        'Read Apps Script project files. Source code is omitted by default to keep responses compact.',
      inputSchema: z.object({
        script_id: z.string().min(1),
        version_number: z.number().int().positive().optional(),
        include_source: z.boolean().default(false),
      }),
    },
    async ({ script_id, version_number, include_source }) => {
      try {
        const content = await getProjectContent(script_id, version_number);

        if (include_source) {
          return result(content);
        }

        return result({
          scriptId: content.scriptId,
          files: remoteFileSummary(content),
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'projects_update_content',
    {
      description:
        'Replace ALL files in an Apps Script project. This is destructive: omitted remote files are deleted. Call with confirm_replace=false first for a preview, then true to apply.',
      inputSchema: z.object({
        script_id: z.string().min(1),
        confirm_replace: z.boolean().default(false),
        files: z
          .array(
            z.object({
              name: z.string().min(1),
              type: z.enum(['SERVER_JS', 'HTML', 'JSON']),
              source: z.string(),
            }),
          )
          .min(1),
      }),
    },
    async ({ script_id, confirm_replace, files }) => {
      try {
        assertManifest(files);

        const current = await getProjectContent(script_id);
        const preview = {
          warning:
            'projects.updateContent replaces the full Apps Script project file set.',
          current_files: remoteFileSummary(current),
          proposed_files: summarizeFiles(files),
        };

        if (!confirm_replace) {
          return result({
            applied: false,
            ...preview,
            next_step:
              'Review the preview, then call again with confirm_replace=true if the complete replacement is intended.',
          });
        }

        const updated = await updateProjectContent(script_id, files);
        return result({
          applied: true,
          files: remoteFileSummary(updated),
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'projects_push_directory',
    {
      description:
        'Load a local flat Apps Script source directory (.gs/.js/.html plus appsscript.json) and replace ALL remote project files. Uses the same explicit confirmation guard as updateContent.',
      inputSchema: z.object({
        script_id: z.string().min(1),
        directory: z.string().min(1),
        confirm_replace: z.boolean().default(false),
      }),
    },
    async ({ script_id, directory, confirm_replace }) => {
      try {
        const files = await loadAppsScriptDirectory(directory);
        const current = await getProjectContent(script_id);

        const preview = {
          directory,
          warning:
            'This operation replaces the complete remote Apps Script file set.',
          current_files: remoteFileSummary(current),
          local_files: summarizeFiles(files),
        };

        if (!confirm_replace) {
          return result({
            applied: false,
            ...preview,
            next_step:
              'Review the file lists, then call again with confirm_replace=true.',
          });
        }

        const updated = await updateProjectContent(script_id, files);
        return result({
          applied: true,
          directory,
          files: remoteFileSummary(updated),
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'versions_create',
    {
      description:
        'Create an immutable Apps Script version from the current HEAD content.',
      inputSchema: z.object({
        script_id: z.string().min(1),
        description: z.string().optional(),
      }),
    },
    async ({ script_id, description }) => {
      try {
        return result(await createVersion(script_id, description));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'versions_list',
    {
      description: 'List versions for an Apps Script project.',
      inputSchema: z.object({
        script_id: z.string().min(1),
        page_size: z.number().int().min(1).max(200).default(50),
        page_token: z.string().optional(),
      }),
    },
    async ({ script_id, page_size, page_token }) => {
      try {
        return result(await listVersions(script_id, page_size, page_token));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'deployments_create',
    {
      description:
        'Create an Apps Script deployment from an existing immutable version.',
      inputSchema: z.object({
        script_id: z.string().min(1),
        version_number: z.number().int().positive(),
        description: z.string().optional(),
        manifest_file_name: z.string().min(1).default('appsscript'),
      }),
    },
    async ({
      script_id,
      version_number,
      description,
      manifest_file_name,
    }) => {
      try {
        return result(
          await createDeployment(
            script_id,
            version_number,
            description,
            manifest_file_name,
          ),
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'deployments_list',
    {
      description: 'List deployments for an Apps Script project.',
      inputSchema: z.object({
        script_id: z.string().min(1),
        page_size: z.number().int().min(1).max(200).default(50),
        page_token: z.string().optional(),
      }),
    },
    async ({ script_id, page_size, page_token }) => {
      try {
        return result(
          await listDeployments(script_id, page_size, page_token),
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'deployments_get',
    {
      description: 'Get one Apps Script deployment.',
      inputSchema: z.object({
        script_id: z.string().min(1),
        deployment_id: z.string().min(1),
      }),
    },
    async ({ script_id, deployment_id }) => {
      try {
        return result(await getDeployment(script_id, deployment_id));
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'deployments_update',
    {
      description:
        'Point an existing Apps Script deployment at another version and/or update its description.',
      inputSchema: z.object({
        script_id: z.string().min(1),
        deployment_id: z.string().min(1),
        version_number: z.number().int().positive(),
        description: z.string().optional(),
        manifest_file_name: z.string().min(1).default('appsscript'),
      }),
    },
    async ({
      script_id,
      deployment_id,
      version_number,
      description,
      manifest_file_name,
    }) => {
      try {
        return result(
          await updateDeployment(
            script_id,
            deployment_id,
            version_number,
            description,
            manifest_file_name,
          ),
        );
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  server.registerTool(
    'deployments_delete',
    {
      description:
        'Delete an Apps Script deployment. This can break applications using the deployment, so confirm_delete must be true.',
      inputSchema: z.object({
        script_id: z.string().min(1),
        deployment_id: z.string().min(1),
        confirm_delete: z.boolean().default(false),
      }),
    },
    async ({ script_id, deployment_id, confirm_delete }) => {
      try {
        if (!confirm_delete) {
          const deployment = await getDeployment(script_id, deployment_id);
          return result({
            deleted: false,
            warning:
              'Deleting a deployment can break any web app, API executable, or add-on that depends on it.',
            deployment,
            next_step:
              'Call again with confirm_delete=true only if deletion is intended.',
          });
        }

        await deleteDeployment(script_id, deployment_id);
        return result({
          deleted: true,
          script_id,
          deployment_id,
        });
      } catch (error) {
        return errorResult(error);
      }
    },
  );

  return server;
}

import { google, script_v1 } from 'googleapis';
import { getAuthorizedClient } from './auth.js';

export type AppsScriptFile = {
  name: string;
  type: 'SERVER_JS' | 'HTML' | 'JSON';
  source: string;
};

export async function getAppsScriptApi(): Promise<script_v1.Script> {
  const auth = await getAuthorizedClient();
  return google.script({ version: 'v1', auth });
}

export async function createProject(
  title: string,
  parentId?: string,
): Promise<script_v1.Schema$Project> {
  const api = await getAppsScriptApi();
  const response = await api.projects.create({
    requestBody: {
      title,
      ...(parentId ? { parentId } : {}),
    },
  });
  return response.data;
}

export async function getProject(
  scriptId: string,
): Promise<script_v1.Schema$Project> {
  const api = await getAppsScriptApi();
  const response = await api.projects.get({ scriptId });
  return response.data;
}

export async function getProjectContent(
  scriptId: string,
  versionNumber?: number,
): Promise<script_v1.Schema$Content> {
  const api = await getAppsScriptApi();
  const response = await api.projects.getContent({
    scriptId,
    ...(versionNumber ? { versionNumber } : {}),
  });
  return response.data;
}

export async function updateProjectContent(
  scriptId: string,
  files: AppsScriptFile[],
): Promise<script_v1.Schema$Content> {
  const api = await getAppsScriptApi();
  const response = await api.projects.updateContent({
    scriptId,
    requestBody: { files },
  });
  return response.data;
}

export async function createVersion(
  scriptId: string,
  description?: string,
): Promise<script_v1.Schema$Version> {
  const api = await getAppsScriptApi();
  const response = await api.projects.versions.create({
    scriptId,
    requestBody: description ? { description } : {},
  });
  return response.data;
}

export async function listVersions(
  scriptId: string,
  pageSize = 50,
  pageToken?: string,
): Promise<script_v1.Schema$ListVersionsResponse> {
  const api = await getAppsScriptApi();
  const response = await api.projects.versions.list({
    scriptId,
    pageSize,
    ...(pageToken ? { pageToken } : {}),
  });
  return response.data;
}

export async function createDeployment(
  scriptId: string,
  versionNumber: number,
  description?: string,
  manifestFileName = 'appsscript',
): Promise<script_v1.Schema$Deployment> {
  const api = await getAppsScriptApi();
  const response = await api.projects.deployments.create({
    scriptId,
    requestBody: {
      versionNumber,
      manifestFileName,
      ...(description ? { description } : {}),
    },
  });
  return response.data;
}

export async function listDeployments(
  scriptId: string,
  pageSize = 50,
  pageToken?: string,
): Promise<script_v1.Schema$ListDeploymentsResponse> {
  const api = await getAppsScriptApi();
  const response = await api.projects.deployments.list({
    scriptId,
    pageSize,
    ...(pageToken ? { pageToken } : {}),
  });
  return response.data;
}

export async function getDeployment(
  scriptId: string,
  deploymentId: string,
): Promise<script_v1.Schema$Deployment> {
  const api = await getAppsScriptApi();
  const response = await api.projects.deployments.get({
    scriptId,
    deploymentId,
  });
  return response.data;
}

export async function updateDeployment(
  scriptId: string,
  deploymentId: string,
  versionNumber: number,
  description?: string,
  manifestFileName = 'appsscript',
): Promise<script_v1.Schema$Deployment> {
  const api = await getAppsScriptApi();
  const response = await api.projects.deployments.update({
    scriptId,
    deploymentId,
    requestBody: {
      deploymentConfig: {
        scriptId,
        versionNumber,
        manifestFileName,
        ...(description ? { description } : {}),
      },
    },
  });
  return response.data;
}

export async function deleteDeployment(
  scriptId: string,
  deploymentId: string,
): Promise<void> {
  const api = await getAppsScriptApi();
  await api.projects.deployments.delete({
    scriptId,
    deploymentId,
  });
}

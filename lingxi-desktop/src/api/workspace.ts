/**
 * 工作区管理 API
 */
import apiClient from './client'

export interface WorkspaceInfo {
  workspace: string | null
  lingxi_dir: string | null
  is_initialized: boolean
}

export interface WorkspaceSwitchRequest {
  workspace_path: string
  force: boolean
}

export interface WorkspaceSwitchResponse {
  success: boolean
  data?: {
    previous_workspace: string
    current_workspace: string
    lingxi_dir: string
    switched_at: string
  }
  error?: string
}

export interface WorkspaceValidateResponse {
  valid: boolean
  exists: boolean
  has_lingxi_dir: boolean
  message: string
}

export interface WorkspaceInitializeResponse {
  success: boolean
  data?: {
    workspace: string
    lingxi_dir: string
  }
  error?: string
}

/**
 * 获取当前工作区
 */
export async function getCurrentWorkspace(): Promise<WorkspaceInfo> {
  const response = await apiClient.get('/api/workspace/current')
  return response
}

/**
 * 切换工作区
 */
export async function switchWorkspace(workspacePath: string, force: boolean = false): Promise<WorkspaceSwitchResponse> {
  const response = await apiClient.post('/api/workspace/switch', {
    workspace_path: workspacePath,
    force
  })
  return response
}

/**
 * 初始化工作区
 */
export async function initializeWorkspace(workspacePath?: string): Promise<WorkspaceInitializeResponse> {
  const response = await apiClient.post('/api/workspace/initialize', {
    workspace_path: workspacePath
  })
  return response
}

/**
 * 验证工作区
 */
export async function validateWorkspace(workspacePath: string): Promise<WorkspaceValidateResponse> {
  const response = await apiClient.get('/api/workspace/validate', {
    params: { workspace_path: workspacePath }
  })
  return response
}

/**
 * 获取工作区会话
 */
export async function getWorkspaceSessions(workspacePath?: string): Promise<{ success: boolean; sessions: any[] }> {
  const response = await apiClient.get('/api/workspace/sessions', {
    params: { workspace_path: workspacePath }
  })
  return response
}

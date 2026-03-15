/**
 * 文件操作 API
 */
import apiClient from './client'
import { electronAPI } from '@/utils/electron'

export interface FileInfo {
  path: string
  name: string
  size: number
  type: string
  created_at?: string
  modified_at?: string
}

/**
 * 打开文件（返回文件内容）
 */
export async function openFile(filePath: string): Promise<string> {
  // 优先使用 Electron API（如果可用）
  if (electronAPI.isElectron()) {
    const result = await electronAPI.readFile(filePath)
    return result.content
  } else {
    // Web 环境通过后端 API 读取
    const response = await apiClient.get('/api/file/read', {
      params: { path: filePath }
    })
    return response.content
  }
}

/**
 * 保存文件
 */
export async function saveFile(
  filePath: string,
  content: string
): Promise<void> {
  if (electronAPI.isElectron()) {
    await (window as any).electronAPI.writeFile(filePath, content)
  } else {
    await apiClient.post('/api/file/write', {
      path: filePath,
      content
    })
  }
}

/**
 * 上传文件
 */
export async function uploadFile(file: File): Promise<FileInfo> {
  const formData = new FormData()
  formData.append('file', file)
  
  const response = await apiClient.post('/api/file/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return response
}

/**
 * 删除文件
 */
export async function deleteFile(filePath: string): Promise<void> {
  await apiClient.delete('/api/file', {
    params: { path: filePath }
  })
}

/**
 * 列出目录内容
 */
export async function listDirectory(dirPath: string): Promise<FileInfo[]> {
  const response = await apiClient.get('/api/file/list', {
    params: { path: dirPath }
  })
  return response
}

/**
 * 创建目录
 */
export async function createDirectory(dirPath: string): Promise<void> {
  await apiClient.post('/api/file/mkdir', { path: dirPath })
}

/**
 * 技能管理 API
 */
import apiClient from './client'

export interface Skill {
  skill_id: string
  name: string
  description: string
  version: string
  status: string
  manifest?: any
  source?: string
}

/**
 * 获取技能列表
 */
export async function getSkills(enabledOnly: boolean = false): Promise<Skill[]> {
  const response = await apiClient.get('/api/skills', {
    params: { enabled_only: enabledOnly }
  })
  return response.skills
}

/**
 * 获取技能详情
 */
export async function getSkill(skillId: string): Promise<Skill> {
  const response = await apiClient.get(`/api/skills/${skillId}`)
  return response
}

/**
 * 安装技能
 */
export async function installSkill(skillData: any, skillFiles: any, overwrite: boolean = false): Promise<{ skill_id: string; status: string; message: string }> {
  const response = await apiClient.post('/api/skills/install', {
    skill_data: skillData,
    skill_files: skillFiles,
    overwrite
  })
  return response
}

/**
 * 重新加载技能
 */
export async function reloadSkill(skillId: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post(`/api/skills/${skillId}/reload`)
  return response
}

/**
 * 卸载技能
 */
export async function uninstallSkill(skillId: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete(`/api/skills/${skillId}`)
  return response
}

/**
 * 诊断技能
 */
export async function diagnoseSkill(skillId: string): Promise<{ skill_id: string; status: string; diagnostic_result: any }> {
  const response = await apiClient.get(`/api/skills/${skillId}/diagnose`)
  return response
}

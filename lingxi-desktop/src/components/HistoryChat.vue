<template>
  <div class="history-chat">
    <div class="history-chat-workspace">
      <div class="workspace-path">
        当前工作区路径
      </div>
      <el-button
        type="primary"
        size="small"
        class="new-session-btn"
        @click="handleNewSession"
      >
        + 新建会话
      </el-button>
    </div>
    <div class="history-chat-list">
      <div
        v-for="session in filteredSessions"
        :key="session.id"
        class="history-chat-item"
        :class="{ active: session.id === currentSessionId }"
        @click="handleSelectSession(session.id)"
      >
        <div class="history-chat-item-icon">
          <el-icon><ChatDotRound /></el-icon>
        </div>
        <div class="history-chat-item-content">
          <div class="history-chat-item-name">{{ truncateSessionName(session.name) }}</div>
        </div>
        <div class="history-chat-item-actions">
          <el-dropdown @command="(command) => handleCommand(command, session)">
            <el-button link size="small" class="action-button">
              <el-icon><More /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="rename">
                  <el-icon class="mr-2"><Edit /></el-icon>
                  重命名
                </el-dropdown-item>
                <el-dropdown-item command="delete" type="danger">
                  <el-icon class="mr-2"><Delete /></el-icon>
                  删除
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { storeToRefs } from 'pinia'
import { ElMessageBox } from 'element-plus'
import { ChatDotRound, More, Edit, Delete } from '@element-plus/icons-vue'

const appStore = useAppStore()
const { sessions, currentSessionId } = storeToRefs(appStore)

const filteredSessions = computed(() => {
  return sessions.value
})

function truncateSessionName(name: string, maxLength: number = 10): string {
  if (!name) return '新会话'
  if (name.length <= maxLength) return name
  return name.substring(0, maxLength) + '...'
}

async function handleNewSession() {
  try {
    const sessionData = await window.electronAPI.api.createSession()
    // 转换后端返回的会话数据格式为前端期望的格式
    const session = {
      id: sessionData.session_id,
      name: sessionData.user_name || '新会话'
    }
    appStore.setSessions([...sessions.value, session])
    await handleSelectSession(session.id)
  } catch (error) {
    console.error('Failed to create session:', error)
  }
}

async function handleSelectSession(sessionId: string) {
  console.log('handleSelectSession called with sessionId:', sessionId)
  appStore.setCurrentSession(sessionId)
  
  try {
    console.log('Calling getSessionHistory for sessionId:', sessionId)
    const history = await window.electronAPI.api.getSessionHistory(sessionId)
    console.log('Received history:', history)
    
    // 转换后端返回的历史记录格式为前端期望的格式
    const turns = history.history.map((item: any, index: number) => {
      // 如果content中包含步骤和思考信息，解析它们
      let steps = item.steps || []
      let thought = item.thought || ''
      
      if (item.content && typeof item.content === 'string') {
        // 尝试从content中解析步骤和思考信息
        const content = item.content
        
        // 检查是否包含"## 步骤"标记
        if (content.includes('## 步骤')) {
          const stepRegex = /## 步骤 \d+：思考\s*\*\*思考\*\*：([\s\S]*?)\s*\*\*执行\*\*：([\s\S]*?)(?=## 步骤|# 最终结果|$)/g
          const matches = [...content.matchAll(stepRegex)]
          
          if (matches.length > 0) {
            steps = matches.map((match, i) => ({
              stepIndex: i,
              description: `步骤 ${i + 1}`,
              status: 'completed',
              thought: match[1].trim(),
              result: match[2].trim()
            }))
          }
        }
        
        // 检查是否包含思考链信息
        if (content.includes('# 思考链')) {
          const thoughtChainMatch = content.match(/# 思考链\s*\n\n([\s\S]*?)(?=# 最终结果|$)/)
          if (thoughtChainMatch) {
            thought = thoughtChainMatch[1].trim()
          }
        }
      }
      
      return {
        id: `${sessionId}_${index}`,
        role: item.role,
        content: item.content,
        time: item.time || Date.now(),
        timestamp: item.time || Date.now(),
        metadata: item.metadata,
        thought: thought,
        observation: item.observation,
        skill_calls: item.skill_calls,
        steps: steps,
        thought_chain: item.thought_chain || null,
        plan: item.plan || null,
        executionId: item.executionId || null,
        status: item.status || null,
        isThinking: item.isThinking || false,
        isStreaming: item.isStreaming || false
      }
    })
    
    console.log('Converted turns:', turns)
    appStore.setTurns(turns)
    console.log('Set turns in appStore:', appStore.turns)
  } catch (error) {
    console.error('Failed to load session history:', error)
    // 即使获取历史失败，也更新为会话的历史记录为空
    appStore.setTurns([])
  }
}

async function handleCommand(command: string, session: any) {
  if (command === 'rename') {
    try {
      const { value } = await ElMessageBox.prompt('请输入新名称', '重命名会话', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: session.name
      })
      
      if (value) {
        // 调用后端 API 更新会话名称
        if (window.electronAPI.api.updateSessionName) {
          await window.electronAPI.api.updateSessionName(session.id, value)
        }
        // 更新前端会话列表
        const updatedSessions = sessions.value.map(s =>
          s.id === session.id ? { ...s, name: value } : s
        )
        appStore.setSessions(updatedSessions)
      }
    } catch {
      console.log('Rename cancelled')
    }
  } else if (command === 'delete') {
    try {
      await ElMessageBox.confirm('确定要删除此会话吗？', '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      if (window.electronAPI.api.deleteSession) {
        await window.electronAPI.api.deleteSession(session.id)
      }
      const updatedSessions = sessions.value.filter(s => s.id !== session.id)
      appStore.setSessions(updatedSessions)
      
      if (currentSessionId.value === session.id) {
        appStore.setCurrentSession(updatedSessions[0]?.id || null)
        appStore.setTurns([])
      }
    } catch {
      console.log('Delete cancelled')
    }
  }
}
</script>

<style scoped lang="scss">
.history-chat {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-right: 1px solid #e8e8e8;
}

.history-chat-workspace {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.workspace-path {
  font-size: 12px;
  color: #666666;
  margin-bottom: 8px;
}

.new-session-btn {
  width: 100%;
  border-radius: 4px;
}

.history-chat-list {
  flex: 1;
  overflow-y: auto;
}

.history-chat-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #f5f5f5;
  }

  &.active {
    background-color: #e6f7ff;
  }
}

.history-chat-item-icon {
  margin-right: 8px;
  color: #1890ff;

  .el-icon {
    font-size: 16px;
  }
}

.history-chat-item-content {
  flex: 1;
}

.history-chat-item-name {
  font-size: 14px;
  color: #333333;
  line-height: 20px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.history-chat-item-actions {
  margin-left: 8px;

  .action-button {
    opacity: 0;
    transition: opacity 0.2s;
    padding: 0;
    width: 24px;
    height: 24px;
  }
}

.history-chat-item:hover .history-chat-item-actions .action-button {
  opacity: 1;
}

.action-button .el-icon {
  font-size: 14px;
  color: #666666;
}

.action-button:hover .el-icon {
  color: #1890ff;
}
</style>

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
        @click="session.id && handleSelectSession(session.id)"
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
  // 过滤掉没有有效 id 的会话
  return sessions.value.filter(session => session && session.id)
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
      name: sessionData.first_message || '新会话'
    }
    appStore.setSessions([...sessions.value, session])
    await handleSelectSession(session.id)
  } catch (error) {
    console.error('Failed to create session:', error)
  }
}

async function handleSelectSession(sessionId: string) {
  console.log('handleSelectSession called with sessionId:', sessionId)
  
  // 检查 sessionId 是否有效
  if (!sessionId) {
    console.error('Invalid sessionId')
    appStore.setTurns([])
    return
  }
  
  appStore.setCurrentSession(sessionId)
  
  try {
    console.log('Calling getSessionInfo for sessionId:', sessionId)
    const sessionInfo = await window.electronAPI.api.getSessionInfo(sessionId)
    console.log('Received sessionInfo:', sessionInfo)
    
    // 从 sessionInfo.task_list 中构建 turns
    const turns = []
    if (sessionInfo.task_list && Array.isArray(sessionInfo.task_list)) {
      sessionInfo.task_list.forEach((task: any, taskIndex: number) => {
        // 添加用户输入
        if (task.user_input) {
          turns.push({
            id: `${sessionId}_${taskIndex}_user`,
            role: 'user',
            content: task.user_input,
            time: task.created_at || Date.now(),
            timestamp: task.created_at || Date.now(),
            steps: [],
            plan: null,
            status: null,
            isStreaming: false
          })
        }
        
        // 添加助手响应
        if (task.result) {
          turns.push({
            id: `${sessionId}_${taskIndex}_assistant`,
            role: 'assistant',
            content: task.result,
            time: task.created_at ? new Date(task.created_at).getTime() + 1000 : Date.now(),
            timestamp: task.created_at ? new Date(task.created_at).getTime() + 1000 : Date.now(),
            steps: task.steps || [],
            plan: task.plan || null,
            status: task.status || null,
            isStreaming: false
          })
        }
      })
    }
    appStore.setTurns(turns)
  } catch (error: any) {
    console.error('Failed to load session info:', error)
    // 检查是否是 404 错误（会话不存在）
    if (error?.response?.status === 404 || error?.message?.includes('不存在')) {
      console.log('Session does not exist, creating new session')
      // 会话不存在，创建新会话
      try {
        const sessionData = await window.electronAPI.api.createSession()
        const session = {
          id: sessionData.session_id,
          name: sessionData.first_message || '新会话'
        }
        appStore.setSessions([...sessions.value, session])
        appStore.setCurrentSession(session.id)
        appStore.setTurns([])
      } catch (createError) {
        console.error('Failed to create session:', createError)
        appStore.setTurns([])
      }
    } else {
      // 其他错误，将 turns 设置为空数组
      appStore.setTurns([])
    }
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

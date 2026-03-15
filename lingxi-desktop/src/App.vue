<template>
  <div id="app" class="app-container">
    <TitleBar />
    <ResumeBanner v-if="activeCheckpoints.length > 0" />
    <EdgeWidget v-if="isEdgeHidden" />
    <LayoutContainer />
    <WorkspaceSwitchDialog />
    <WorkspaceInitializer />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import EdgeWidget from './components/EdgeWidget.vue'
import LayoutContainer from './components/LayoutContainer.vue'
import ResumeBanner from './components/ResumeBanner.vue'
import TitleBar from './components/TitleBar.vue'
import WorkspaceInitializer from './components/WorkspaceInitializer.vue'
import WorkspaceSwitchDialog from './components/WorkspaceSwitchDialog.vue'
import { useAppStore } from './stores/app'
import { useWorkspaceStore } from './stores/workspace'
import { useSessionStore } from './stores/session'
import { useChatStore } from './stores/chat'

const appStore = useAppStore()
const workspaceStore = useWorkspaceStore()
const sessionStore = useSessionStore()
const chatStore = useChatStore()

const isEdgeHidden = computed(() => {
  return window.electronAPI?.window?.edgeCheck?.() || false
})

const activeCheckpoints = computed(() => {
  return appStore.activeCheckpoints
})

onMounted(async () => {
  await initializeApp()
  setupWebSocketListeners()
})

onUnmounted(() => {
  // WebSocket 连接将由前端直接与后端建立
  // 暂时保留空函数，以便未来实现前端 WebSocket 连接的清理
  console.log('[App] App unmounted')
})

async function initializeApp() {
  console.log('[App] initializeApp called')
  appStore.setLoading(true)

  try {
    // 首先加载工作区信息
    console.log('[App] Loading current workspace...')
    await workspaceStore.loadCurrentWorkspace()
    console.log('[App] Current workspace loaded:', workspaceStore.currentWorkspace)

    // 使用 sessionStore 加载会话列表
    try {
      await sessionStore.loadSessions()
    } catch (error) {
      console.error('[App] Failed to load sessions:', error)
    }
    
    // 同步到 appStore
    appStore.setSessions(sessionStore.sessions)

    if (sessionStore.sessions.length > 0) {
      const firstSession = sessionStore.sessions[0]
      appStore.setCurrentSession(firstSession.id)
      sessionStore.setCurrentSession(firstSession.id)
      
      // 使用 sessionStore 加载会话消息
      try {
        await sessionStore.loadSessionMessages(firstSession.id)
        appStore.setTurns(sessionStore.currentSessionMessages)
      } catch (error) {
        console.error('[App] Failed to load session messages:', error)
        appStore.setTurns([])
      }
    } else {
      // 没有会话时，创建一个新会话
      try {
        const session = await sessionStore.createNewSession()
        appStore.setSessions(sessionStore.sessions)
        appStore.setCurrentSession(session.id)
        appStore.setTurns([])
      } catch (error) {
        console.error('[App] Failed to create initial session:', error)
      }
    }
  } catch (error) {
    console.error('Failed to initialize app:', error)
  } finally {
    appStore.setLoading(false)
  }
}

function setupWebSocketListeners() {
  // WebSocket 连接将由前端直接与后端建立
  // 暂时保留空函数，以便未来实现前端 WebSocket 连接
  console.log('[App] WebSocket listeners setup')
}
</script>

<style scoped lang="scss">
.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: $bg-page;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  box-sizing: border-box;
}
</style>

<template>
  <div class="resume-banner">
    <el-icon class="resume-banner-icon"><InfoFilled /></el-icon>
    <span class="resume-banner-text">
      您有 {{ activeCheckpoints.length }} 个未完成的任务，点击继续
    </span>
    <el-button
      type="primary"
      size="small"
      link
      @click="handleResume"
    >
      继续任务
    </el-button>
    <el-button
      size="small"
      link
      @click="handleDismiss"
    >
      忽略
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { InfoFilled } from '@element-plus/icons-vue'
import { useAppStore } from '../stores/app'
import { storeToRefs } from 'pinia'

const appStore = useAppStore()
const { activeCheckpoints } = storeToRefs(appStore)

function handleResume() {
  if (activeCheckpoints.value.length > 0) {
    const checkpoint = activeCheckpoints.value[0]
    window.electronAPI.api.resumeCheckpoint(checkpoint.sessionId)
  }
}

function handleDismiss() {
  console.log('Dismiss banner')
}
</script>

<style scoped lang="scss">
.resume-banner {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  background-color: #ecf5ff;
  border-bottom: 1px solid #d9ecff;
}

.resume-banner-icon {
  margin-right: 8px;
  color: $primary-color;
  font-size: 18px;
}

.resume-banner-text {
  flex: 1;
  font-size: $font-size-small;
  color: $text-primary;
}
</style>

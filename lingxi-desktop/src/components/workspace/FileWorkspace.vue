<template>
  <div class="file-workspace">
    <div class="file-workspace-header">
      <span class="file-workspace-title">工作区目录</span>
    </div>
    <div class="file-workspace-tree">
      <el-tree
        :data="fileTree"
        node-key="id"
        :default-expanded-keys="['workspace']"
        :expand-on-click-node="false"
        class="file-tree"
      >
        <template #default="{ node, data }">
          <div class="file-tree-node">
            <span class="file-icon">
              <svg v-if="data.children && data.children.length > 0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon folder-icon" :class="{ 'folder-open': node.expanded }">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
              <svg v-else-if="isImageFile(data.label)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon image-icon">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <svg v-else-if="isCodeFile(data.label)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon code-icon">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
              <svg v-else-if="isDocFile(data.label)" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon doc-icon">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon file-icon">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                <polyline points="13 2 13 9 20 9"></polyline>
              </svg>
            </span>
            <span class="file-tree-node-text">{{ node.label }}</span>
          </div>
        </template>
      </el-tree>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface TreeNode {
  id: string
  label: string
  children?: TreeNode[]
}

const fileTree = ref<TreeNode[]>([
  {
    id: 'workspace',
    label: 'workspace',
    children: [
      {
        id: 'xxxx.docx',
        label: 'xxxx.docx'
      },
      {
        id: 'xxx.xlsx',
        label: 'xxx.xlsx'
      },
      {
        id: 'index.html',
        label: 'index.html'
      },
      {
        id: 'docs',
        label: 'docs',
        children: []
      },
      {
        id: 'template',
        label: 'template',
        children: []
      }
    ]
  }
])

const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico']
const codeExtensions = ['.html', '.css', '.js', '.ts', '.vue', '.jsx', '.tsx', '.json', '.py', '.java', '.c', '.cpp', '.h']
const docExtensions = ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf', '.txt', '.md']

const getFileExtension = (filename: string): string => {
  const lastDot = filename.lastIndexOf('.')
  return lastDot !== -1 ? filename.substring(lastDot).toLowerCase() : ''
}

const isImageFile = (filename: string): boolean => {
  return imageExtensions.includes(getFileExtension(filename))
}

const isCodeFile = (filename: string): boolean => {
  return codeExtensions.includes(getFileExtension(filename))
}

const isDocFile = (filename: string): boolean => {
  return docExtensions.includes(getFileExtension(filename))
}
</script>

<style scoped lang="scss">
.file-workspace {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
}

.file-workspace-header {
  padding: 16px;
  border-bottom: 1px solid #e8e8e8;
}

.file-workspace-title {
  font-size: 14px;
  font-weight: 500;
  color: #333333;
}

.file-workspace-tree {
  flex: 1;
  overflow-y: auto;
}

.file-tree {
  padding: 8px 0;
  
  :deep(.el-tree-node.is-current > .el-tree-node__content) {
    background-color: #e6f7ff;
  }
  
  :deep(.el-tree-node__content) {
    height: 32px;
    padding: 0 8px;
    
    &:hover {
      background-color: #f5f7fa;
    }
  }
  
  :deep(.el-tree-node__expand-icon) {
    font-size: 12px;
    color: #999;
    padding: 6px;
  }
  
  :deep(.el-tree-node__label) {
    font-size: 14px;
    color: #333333;
  }
}

.file-tree-node {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon {
  width: 16px;
  height: 16px;
}

.folder-icon {
  color: #f0c040;
}

.folder-open {
  color: #f0c040;
}

.image-icon {
  color: #52c41a;
}

.code-icon {
  color: #1890ff;
}

.doc-icon {
  color: #722ed1;
}

.file-icon {
  color: #8c8c8c;
}

.file-tree-node-text {
  flex: 1;
  font-size: 14px;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>

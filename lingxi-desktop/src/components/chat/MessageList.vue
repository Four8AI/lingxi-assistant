<template>
  <div class="message-list" ref="scrollContainer">
    <div
      v-for="turn in turns"
      :key="turn.id || turn.time"
      class="message-item"
      :class="turn.role"
    >
      <div class="message-avatar">
        <el-icon v-if="turn.role === 'user'">
          <User /></el-icon>
        <el-icon v-else>
          <ChatDotRound /></el-icon>
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-role">{{ turn.role === 'user' ? '用户' : '助手' }}</span>
          <span class="message-time">{{ formatTime(turn.time || turn.timestamp) }}</span>
          <span v-if="turn.status" class="message-status" :class="turn.status">{{ turn.status === 'running' ? '执行中' : turn.status === 'completed' ? '已完成' : '失败' }}</span>
        </div>
        <div v-if="turn.thought" class="message-thought">
          <div class="thought-label">思考过程：</div>
          <div class="thought-content">{{ turn.thought }}</div>
        </div>
        <div v-if="turn.plan" class="message-plan">
          <div class="plan-label">执行计划：</div>
          <div class="plan-steps">
            <div v-for="(step, index) in turn.plan.steps" :key="index" class="plan-step">
              {{ index + 1 }}. {{ step }}
            </div>
          </div>
        </div>
        <div v-if="turn.steps && turn.steps.length > 0" class="message-steps">
          <div class="steps-label">执行步骤：</div>
          <div class="steps-list">
            <div v-for="(step, index) in turn.steps" :key="index" class="step-item" :class="step.status">
              <div class="step-header">
                <span class="step-index">{{ step.stepIndex + 1 }}.</span>
                <span class="step-description">{{ step.description }}</span>
                <span class="step-status">{{ step.status === 'running' ? '执行中' : step.status === 'completed' ? '已完成' : '失败' }}</span>
              </div>
              <div v-if="step.result" class="step-result">{{ step.result }}</div>
            </div>
          </div>
        </div>
        <div v-if="!turn.isStreaming" class="message-text-container">
          <div class="message-text" v-html="renderMarkdown(turn.content)" />
        </div>
        <div v-else class="message-text-container streaming">
          <div class="streaming-indicator">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在生成回复...</span>
          </div>
        </div>
        <StepInterventionCard
          v-if="hasFailedSteps(turn)"
          :steps="buildSteps(turn)"
          @skip="handleSkip"
          @retry="handleRetry"
          @batch-retry="handleBatchRetry"
          @submit="handleSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useAppStore } from '../../stores/app'
import { storeToRefs } from 'pinia'
import { User, ChatDotRound, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ThoughtChainPanel from './ThoughtChainPanel.vue'
import StepInterventionCard from './StepInterventionCard.vue'
import { marked } from 'marked'

const appStore = useAppStore()
const { turns } = storeToRefs(appStore)

const scrollContainer = ref<HTMLElement>()

watch(turns, () => {
  nextTick(() => {
    scrollToBottom()
  })
}, { deep: true })

function scrollToBottom() {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function renderMarkdown(content: any): string {
  if (!content) return ''
  
  // 检查是否为JSON格式的内容
  if (typeof content === 'object' && content !== null) {
    // 提取最终结果部分
    if (content.final_result) {
      return marked('# 最终结果\n\n' + content.final_result)
    } else if (content.result) {
      return marked('# 最终结果\n\n' + content.result)
    } else if (content.content) {
      // 如果JSON中包含content字段，递归处理
      return renderMarkdown(content.content)
    } else {
      // 如果没有找到最终结果，显示提示信息
      return marked('# 最终结果\n\n*暂无最终结果*')
    }
  }
  
  // 处理字符串格式的内容（Markdown）
  const contentStr = typeof content === 'string' ? content : JSON.stringify(content)
  
  // 提取最终结果部分，只显示最终结果
  if (contentStr.includes('# 最终结果')) {
    const parts = contentStr.split('# 最终结果')
    if (parts.length > 1) {
      const finalResult = parts[1].trim()
      // 如果最终结果部分为空，显示提示信息
      if (!finalResult) {
        return marked('# 最终结果\n\n*暂无最终结果*')
      }
      return marked('# 最终结果' + parts[1])
    }
  }
  
  return marked(contentStr)
}

function hasThoughtChain(turn: any): boolean {
  // 检查是否包含思考链内容
  if (turn.thought) {
    return true
  }
  if (turn.content) {
    // 检查是否为JSON格式的思考链
    if (typeof turn.content === 'object' && turn.content !== null) {
      // 检查JSON对象是否包含思考链相关字段
      return !!turn.content.thought_chain || !!turn.content.steps || 
             !!turn.content.reasoning || !!turn.content.thought
    }
    
    // 检查是否为字符串格式的思考链（Markdown）
    const contentStr = typeof turn.content === 'string' ? turn.content : JSON.stringify(turn.content)
    // 检查是否包含思考链标题
    const hasThoughtChainTitle = contentStr.includes('# 思考链')
    // 检查是否包含思考步骤
    const hasThoughtSteps = contentStr.includes('## 步骤') || contentStr.includes('**思考**：')
    console.log('hasThoughtChain check:', {
      content: contentStr.substring(0, 200) + '...',
      hasThoughtChainTitle,
      hasThoughtSteps,
      result: hasThoughtChainTitle || hasThoughtSteps
    })
    return hasThoughtChainTitle || hasThoughtSteps
  }
  return false
}

function buildThoughtChain(turn: any): any {
  // 从 content 或 thought 中提取思考链数据
  const steps: any[] = []
  
  // 优先从 turn.thought 中提取思考内容
  if (turn.thought) {
    steps.push({
      type: 'execution',
      content: '步骤 1',
      thought: turn.thought,
      action: '',
      result: '',
      status: 'completed'
    })
  } else if (turn.content && typeof turn.content === 'object' && turn.content !== null) {
    console.log('buildThoughtChain JSON content:', turn.content)
    
    // 处理JSON格式的思考链
    if (turn.content.thought_chain && turn.content.thought_chain.steps) {
      // 直接使用JSON中的steps
      steps.push(...turn.content.thought_chain.steps.map((step: any, index: number) => ({
        type: step.type || 'execution',
        content: step.content || `步骤 ${index + 1}`,
        thought: step.thought || step.reasoning || '',
        action: step.action || step.observation || '',
        result: step.result || '',
        status: step.status || 'completed'
      })))
    } else if (turn.content.steps) {
      // 处理直接包含steps的JSON
      steps.push(...turn.content.steps.map((step: any, index: number) => ({
        type: step.type || 'execution',
        content: step.content || `步骤 ${index + 1}`,
        thought: step.thought || step.reasoning || '',
        action: step.action || step.observation || '',
        result: step.result || '',
        status: step.status || 'completed'
      })))
    } else if (turn.content.thought || turn.content.reasoning) {
      // 处理只有单个思考的情况
      steps.push({
        type: 'execution',
        content: '步骤 1',
        thought: turn.content.thought || turn.content.reasoning || '',
        action: turn.content.action || turn.content.observation || '',
        result: turn.content.result || '',
        status: 'completed'
      })
    }
  } else if (turn.content) {
    // 处理字符串格式的思考链（Markdown或混合格式）
    const contentStr = typeof turn.content === 'string' ? turn.content : JSON.stringify(turn.content)
    console.log('buildThoughtChain content:', contentStr.substring(0, 500) + '...')
    
    // 只提取思考链部分，不包含最终结果
    let thoughtChainContent = contentStr
    if (contentStr.includes('# 最终结果')) {
      thoughtChainContent = contentStr.split('# 最终结果')[0]
    }
    console.log('buildThoughtChain thoughtChainContent:', thoughtChainContent.substring(0, 500) + '...')
    
    // 检查是否包含JSON格式的思考链
    // 尝试匹配单个完整的JSON对象
    let remainingContent = thoughtChainContent
    let jsonFound = false
    
    // 循环处理可能的多个JSON对象
    while (remainingContent) {
      // 找到第一个 { 的位置
      const startIndex = remainingContent.indexOf('{')
      if (startIndex === -1) break
      
      // 从 { 开始，尝试找到匹配的 }
      let depth = 1
      let endIndex = startIndex + 1
      let foundEnd = false
      
      while (endIndex < remainingContent.length && depth > 0) {
        const char = remainingContent[endIndex]
        if (char === '{') {
          depth++
        } else if (char === '}') {
          depth--
          if (depth === 0) {
            foundEnd = true
            break
          }
        }
        endIndex++
      }
      
      if (foundEnd) {
        const jsonStr = remainingContent.substring(startIndex, endIndex + 1)
        console.log('Found JSON string:', jsonStr.substring(0, 200) + '...')
        
        try {
          // 尝试解析JSON
          const jsonContent = JSON.parse(jsonStr)
          console.log('buildThoughtChain parsed JSON:', jsonContent)
          
          // 从JSON中提取思考链数据
          if (jsonContent.thought || jsonContent.reasoning) {
            // 处理单个思考步骤
            steps.push({
              type: 'execution',
              content: `步骤 ${steps.length + 1}`,
              thought: jsonContent.thought || jsonContent.reasoning || '',
              action: jsonContent.action || jsonContent.observation || '',
              result: jsonContent.result || '',
              status: 'completed'
            })
            jsonFound = true
          } else if (jsonContent.thought_chain && jsonContent.thought_chain.steps) {
            // 处理包含steps的thought_chain
            steps.push(...jsonContent.thought_chain.steps.map((step: any, index: number) => ({
              type: step.type || 'execution',
              content: step.content || `步骤 ${steps.length + index + 1}`,
              thought: step.thought || step.reasoning || '',
              action: step.action || step.observation || '',
              result: step.result || '',
              status: step.status || 'completed'
            })))
            jsonFound = true
          } else if (jsonContent.steps) {
            // 处理直接包含steps的JSON
            steps.push(...jsonContent.steps.map((step: any, index: number) => ({
              type: step.type || 'execution',
              content: step.content || `步骤 ${steps.length + index + 1}`,
              thought: step.thought || step.reasoning || '',
              action: step.action || step.observation || '',
              result: step.result || '',
              status: step.status || 'completed'
            })))
            jsonFound = true
          }
          
          // 继续处理剩余内容
          remainingContent = remainingContent.substring(endIndex + 1).trim()
        } catch (e) {
          console.error('Failed to parse JSON:', e)
          // JSON解析失败，继续处理剩余内容
          remainingContent = remainingContent.substring(startIndex + 1).trim()
        }
      } else {
        // 没有找到匹配的 }，退出循环
        break
      }
    }
    
    console.log('JSON parsing complete. Steps found:', steps.length)
    
    // 如果JSON解析失败或没有找到JSON，尝试Markdown解析
    if (steps.length === 0) {
      const lines = thoughtChainContent.split('\n')
      let currentStep: any = null
      let inCodeBlock = false
      let currentCode = ''
      
      lines.forEach(line => {
        console.log('buildThoughtChain line:', line)
        if (line.startsWith('```')) {
          // 代码块开始或结束
          inCodeBlock = !inCodeBlock
          if (inCodeBlock) {
            currentCode = ''
          } else {
            // 代码块结束，添加到当前步骤的action中
            if (currentStep) {
              currentStep.action += '\n```python\n' + currentCode + '\n```'
            }
          }
        } else if (inCodeBlock) {
          // 在代码块内，积累代码内容
          currentCode += line + '\n'
        } else if (line.startsWith('## 步骤 ')) {
          // 新步骤开始
          if (currentStep) {
            steps.push(currentStep)
          }
          currentStep = {
            type: 'execution',
            content: line.replace('## ', ''),
            thought: '',
            action: '',
            status: 'completed'
          }
          console.log('buildThoughtChain new step:', currentStep)
        } else if (currentStep && line.startsWith('**思考**：')) {
          currentStep.thought = line.replace('**思考**：', '')
          console.log('buildThoughtChain thought:', currentStep.thought)
        } else if (currentStep && line.startsWith('**执行**：')) {
          // 提取执行内容，去掉开头的标记
          let actionContent = line.replace('**执行**：', '')
          // 如果后面还有内容，会在后续行中添加
          currentStep.action = actionContent
          console.log('buildThoughtChain action:', currentStep.action)
        } else if (currentStep && currentStep.action && line && !line.startsWith('#') && !line.startsWith('## ')) {
          // 非标题行，添加到当前步骤的action中
          currentStep.action += '\n' + line
          console.log('buildThoughtChain action append:', line)
        } else if (currentStep && line.startsWith('**结果**：')) {
          currentStep.result = line.replace('**结果**：', '')
          console.log('buildThoughtChain result:', currentStep.result)
        }
      })
      
      if (currentStep) {
        steps.push(currentStep)
      }
    }
  }
  
  console.log('buildThoughtChain steps:', steps)
  
  return {
    taskId: turn.id || turn.time?.toString(),
    steps: steps,
    status: 'completed'
  }
}

function hasFailedSteps(turn: any): boolean {
  if (turn.status === 'failed') {
    return true
  }
  if (turn.metadata?.action === 'task_failed') {
    return true
  }
  if (turn.steps && turn.steps.some((s: any) => s.status === 'failed')) {
    return true
  }
  if (turn.error) {
    return true
  }
  return false
}

function buildSteps(turn: any): any[] {
  const steps: any[] = []

  if (turn.metadata?.action === 'task_failed') {
    steps.push({
      stepIndex: turn.metadata.failed_step || 0,
      name: '任务执行失败',
      status: 'failed',
      retryCount: 0,
      maxRetries: 3,
      error: {
        message: turn.metadata.error || '未知错误',
        type: 'TaskExecutionError',
        suggestions: ['检查输入参数', '重试任务', '联系技术支持'],
        requiresIntervention: true
      }
    })
  }

  if (turn.steps) {
    turn.steps.forEach((step: any, index: number) => {
      if (step.status === 'failed') {
        steps.push({
          stepIndex: index,
          name: step.description || `步骤 ${index + 1}`,
          status: 'failed',
          retryCount: step.retry_count || 0,
          maxRetries: step.max_retries || 3,
          error: {
            message: step.error || '执行失败',
            type: 'StepExecutionError',
            suggestions: step.suggestions || ['重试步骤', '跳过步骤', '修正参数'],
            requiresIntervention: true
          }
        })
      }
    })
  }

  if (turn.error && steps.length === 0) {
    steps.push({
      stepIndex: 0,
      name: '执行错误',
      status: 'failed',
      retryCount: 0,
      maxRetries: 3,
      error: {
        message: turn.error,
        type: 'ExecutionError',
        suggestions: ['重试操作', '检查配置', '查看日志'],
        requiresIntervention: true
      }
    })
  }

  return steps
}

function handleSkip(stepIndex: number) {
  console.log('Skip step:', stepIndex)
  ElMessage.success(`已跳过步骤 ${stepIndex + 1}`)
}

function handleRetry(stepIndex: number, userInput?: string) {
  console.log('Retry step:', stepIndex, userInput)
  ElMessage.info(`正在重试步骤 ${stepIndex + 1}...`)
}

function handleBatchRetry() {
  console.log('Batch retry')
  ElMessage.info('已启动批量重试')
}

function handleSubmit(userInput: string) {
  console.log('Submit correction:', userInput)
  ElMessage.success('已提交修正内容')
}
</script>

<style scoped lang="scss">
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message-item {
  display: flex;
  margin-bottom: 20px;

  &.user {
    flex-direction: row-reverse;
  }
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: $primary-color;
  display: flex;
  align-items: center;
  justify-content: center;
  color: $bg-color;
  flex-shrink: 0;

  .user & {
    background-color: $success-color;
  }
}

.message-content {
  flex: 1;
  margin: 0 12px;
  max-width: calc(100% - 60px);
}

.message-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;

  .user & {
    flex-direction: row-reverse;
  }
}

.message-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 8px;

  .user & {
    margin-left: 0;
    margin-right: 8px;
  }

  &.running {
    background-color: #e6f7ff;
    color: #1890ff;
  }

  &.completed {
    background-color: #f6ffed;
    color: #52c41a;
  }

  &.failed {
    background-color: #fff2f0;
    color: #ff4d4f;
  }
}

.message-thought {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;

  .thought-label {
    font-weight: 600;
    margin-bottom: 8px;
    color: #666;
  }

  .thought-content {
    line-height: 1.5;
    color: #333;
  }
}

.message-plan {
  background-color: #f0f5ff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;

  .plan-label {
    font-weight: 600;
    margin-bottom: 8px;
    color: #1890ff;
  }

  .plan-steps {
    margin-left: 20px;

    .plan-step {
      margin-bottom: 4px;
      line-height: 1.4;
    }
  }
}

.message-steps {
  background-color: #f9f0ff;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;

  .steps-label {
    font-weight: 600;
    margin-bottom: 8px;
    color: #722ed1;
  }

  .steps-list {
    .step-item {
      margin-bottom: 12px;
      padding: 8px;
      border-radius: 6px;

      &.running {
        background-color: #e6f7ff;
      }

      &.completed {
        background-color: #f6ffed;
      }

      &.failed {
        background-color: #fff2f0;
      }

      .step-header {
        display: flex;
        align-items: center;
        margin-bottom: 4px;

        .step-index {
          font-weight: 600;
          margin-right: 8px;
        }

        .step-description {
          flex: 1;
        }

        .step-status {
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 8px;

          &.running {
            background-color: #1890ff;
            color: white;
          }

          &.completed {
            background-color: #52c41a;
            color: white;
          }

          &.failed {
            background-color: #ff4d4f;
            color: white;
          }
        }
      }

      .step-result {
        margin-top: 4px;
        font-size: 14px;
        line-height: 1.4;
      }
    }
  }
}

.message-role {
  font-size: $font-size-small;
  font-weight: 500;
  color: $text-regular;
}

.message-time {
  font-size: $font-size-small;
  color: $text-secondary;
  margin-left: 8px;

  .user & {
    margin-left: 0;
    margin-right: 8px;
  }
}

.message-text-container {
  .user & {
    text-align: right;
  }

  &.streaming {
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: flex-start;

    .user & {
      justify-content: flex-end;
    }
  }
}

.streaming-indicator {
  display: flex;
  align-items: center;
  color: #999;
  font-size: 14px;

  .is-loading {
    margin-right: 8px;
    animation: rotate 1s linear infinite;
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.message-text {
  font-size: $font-size-base;
  line-height: 1.6;
  color: $text-primary;
  word-wrap: break-word;
  display: inline-block;
  text-align: left;

  h1, h2, h3, h4, h5, h6 {
    margin: 16px 0 8px 0;
    font-weight: 600;
  }

  h1 {
    font-size: 1.5em;
  }

  h2 {
    font-size: 1.3em;
  }

  h3 {
    font-size: 1.1em;
  }

  p {
    margin: 8px 0;
  }

  ul, ol {
    margin: 8px 0;
    padding-left: 24px;
  }

  li {
    margin: 4px 0;
  }

  code {
    background-color: rgba(110, 118, 129, 0.1);
    border-radius: 3px;
    padding: 0.2em 0.4em;
    font-size: 0.9em;
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  }

  pre {
    background-color: rgba(110, 118, 129, 0.1);
    border-radius: 6px;
    padding: 12px;
    overflow-x: auto;
    margin: 12px 0;

    code {
      background-color: transparent;
      padding: 0;
    }
  }

  blockquote {
    border-left: 4px solid #dfe2e5;
    color: #6a737d;
    padding: 0 16px;
    margin: 12px 0;
  }

  a {
    color: #0366d6;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  table {
    border-collapse: collapse;
    margin: 12px 0;
    width: 100%;

    th, td {
      border: 1px solid #dfe2e5;
      padding: 6px 13px;
    }

    th {
      background-color: #f6f8fa;
      font-weight: 600;
    }
  }
}
</style>
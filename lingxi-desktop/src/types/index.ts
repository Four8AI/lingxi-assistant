export interface Session {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  userName?: string
  hasCheckpoint: boolean
  checkpointCount: number
  checkpointExpiry?: number
}

export interface HistoryResponse {
  sessionId: string
  turns: Turn[]
}

export interface Turn {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  thoughtChain?: ThoughtChain
  modelRoute?: ModelRoute
  steps?: Step[]
}

export interface ThoughtChain {
  taskId: string
  steps: ThoughtStep[]
  status: 'pending' | 'running' | 'completed' | 'failed'
}

export interface ThoughtStep {
  stepIndex: number
  type: 'analysis' | 'planning' | 'routing' | 'execution'
  content: string
  confidence?: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  thought?: string
  action?: string
  observation?: string
  error?: string
}

export interface ModelRoute {
  taskId: string
  selectedModel: string
  reason: string
  estimatedTokens: number
  estimatedCost: number
  canOverride: boolean
}

export interface Step {
  stepIndex: number
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  retryCount: number
  maxRetries: number
  startTime?: number
  endTime?: number
  error?: StepError
}

export interface StepError {
  message: string
  type: string
  suggestions: string[]
  requiresIntervention: boolean
}

export interface ExecutionResult {
  executionId: string
  sessionId: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  result?: string
  error?: string
}

export interface ExecutionStatus {
  executionId: string
  sessionId: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  currentStep?: number
  totalSteps?: number
  result?: string
  error?: string
}

export interface Checkpoint {
  sessionId: string
  sessionName: string
  createdAt: number
  expiresAt: number
  executionId: string
  stepIndex: number
  context: Record<string, any>
}

export interface Skill {
  id: string
  name: string
  description: string
  version: string
  author: string
  icon?: string
  status: 'available' | 'error' | 'loading'
  manifest: SkillManifest
  lastUsed?: number
}

export interface SkillManifest {
  name: string
  version: string
  description: string
  author: string
  dependencies?: string[]
  parameters?: SkillParameter[]
}

export interface SkillParameter {
  name: string
  type: string
  required: boolean
  description: string
  default?: any
}

export interface InstallResult {
  success: boolean
  skillId: string
  error?: string
}

export interface DiagnosticResult {
  skillId: string
  status: 'healthy' | 'warning' | 'error'
  issues: DiagnosticIssue[]
  suggestions: string[]
}

export interface DiagnosticIssue {
  severity: 'error' | 'warning' | 'info'
  message: string
  location?: string
}

export interface ResourceUsage {
  cpu: number
  memory: number
  disk: number
  tokens: TokenUsage
  network?: NetworkUsage
}

export interface TokenUsage {
  current: number
  limit: number
  percentage: number
  breakdown: TokenBreakdown[]
}

export interface TokenBreakdown {
  category: string
  count: number
  percentage: number
}

export interface NetworkUsage {
  upload: number
  download: number
}

export interface Config {
  apiUrl: string
  wsUrl: string
  model: string
  maxTokens: number
  timeout: number
  theme: 'light' | 'dark' | 'auto'
  language: string
  autoSave: boolean
  checkpointExpiry: number
}

export interface FileFilter {
  name: string
  extensions: string[]
}

export interface SkillCallData {
  skillId: string
  skillName: string
  status: 'calling' | 'success' | 'failed'
  startTime: number
  endTime?: number
  error?: string
}

export interface ThoughtChainData {
  taskId: string
  step: ThoughtStep
}

export interface StepStatusData {
  executionId: string
  stepIndex: number
  status: 'pending' | 'running' | 'completed' | 'failed'
  error?: StepError
}

export interface ModelRouteData {
  taskId: string
  modelRoute: ModelRoute
}

export interface TaskCompletedData {
  executionId: string
  result: string
  duration: number
}

export interface TaskFailedData {
  executionId: string
  error: string
  stepIndex?: number
}

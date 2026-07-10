import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent, PointerEvent as ReactPointerEvent } from 'react'
import { Excalidraw, convertToExcalidrawElements, exportToBlob, serializeAsJSON } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import { CaptureUpdateAction } from '@excalidraw/excalidraw'
import type { BinaryFileData, ExcalidrawImperativeAPI, LibraryItems } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElement, FileId } from '@excalidraw/excalidraw/element/types'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Bot,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  CircleDot,
  Clock3,
  Download,
  FileJson,
  Grid2X2,
  Globe2,
  History,
  Home,
  ImagePlus,
  PanelLeft,
  PanelRight,
  Play,
  Plus,
  RotateCcw,
  Settings,
  Share2,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react'
import './App.css'
import { seedProjects } from './sampleData'
import { alphaCompassArchitectureCanvas, hasAlphaCompassArchitecture } from './alphaCompassArchitecture'
import { isCloudWorkspaceEnabled, loadCloudWorkspace, saveCloudWorkspace } from './workspaceCloud'
import type {
  Analysis,
  Board,
  CanvasNode,
  CanvasComment,
  CanvasScene,
  CollaboratorNote,
  Project,
  ProjectQuestion,
  ProjectStageName,
  ProjectStageStatus,
  ProjectTask,
  ProjectTool,
  ResearchAsset,
  WorkspaceState,
} from './types'

const storageKey = 'interaction-research-library:v1'
const overviewCardWidthStorageKey = 'interaction-research-library:overview-card-widths:v1'
const workspaceWindowName = 'interaction-research-workspace'

type Language = 'en' | 'zh'

type BoardContextMenu = {
  boardId: string
  projectId: string
  x: number
  y: number
}

type PanelResizeTarget = 'project' | 'library'
type AiAction = 'analyze' | 'compare' | 'summarize' | 'pattern' | 'conflict' | 'tasks' | 'codexPrompt'
type OverviewCardId =
  | 'stage'
  | 'progress'
  | 'question'
  | 'goals'
  | 'timeline'
  | 'tasks'
  | 'completedTasks'
  | 'recent'
  | 'stats'
  | 'tools'
  | 'insights'
type AiMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

type ExternalLibrary = {
  id: string
  name: string
  description: string
  itemNames: string[]
  sourceUrl: string
  previewUrl: string
  downloads?: number
}

type PartnerTab = 'analysis' | 'assets' | 'libraries'

type ToastMessage = {
  id: string
  message: string
}

type CloudSyncStatus = {
  enabled: boolean
  status: 'local' | 'loading' | 'saving' | 'synced' | 'error'
  updatedAt?: string
}

const copy = {
  en: {
    addProject: 'Add project',
    add: 'Add',
    addCanvas: 'Add canvas',
    addSelectedScreenshot: 'Add selected screenshot',
    analyze: 'Analyze',
    aiAnalysis: 'AI Analysis',
    analyzeSelected: 'Analyze selected',
    aiPartner: 'AI Partner',
    aiSuggestions: 'AI Suggestions',
    analysisPanel: 'Analysis Panel',
    assets: 'assets',
    assetsTab: 'Assets',
    biggestQuestion: 'Biggest Question',
    boards: 'Boards',
    cancel: 'Cancel',
    canvas: 'Canvas',
    canvasStatus: 'Excalidraw canvas · screenshots enter automatically',
    collaborator: 'Collaborator',
    collaboratorNotes: 'Collaborator notes',
    commentPlaceholder: 'Write a comment for the selected node...',
    comments: 'Comments',
    completedTasks: 'Completed Tasks',
    copiedReadOnlyLink: 'Read-only link copied',
    cloudError: 'Cloud save failed',
    cloudLoading: 'Loading cloud',
    cloudLocalOnly: 'Local only',
    cloudSaving: 'Saving cloud',
    cloudSynced: 'Cloud synced',
    current: 'Current',
    currentStage: 'Current Stage',
    delete: 'Delete',
    deleteCanvas: 'Move to trash',
    deleteForever: 'Delete forever',
    deleteSelected: 'Delete selected',
    done: 'Done',
    emptyAssets: 'No assets yet',
    emptyAssetsHint: 'Screenshots or pasted website links will be cached here automatically.',
    emptyCollaboratorNotes: 'No collaborator notes yet.',
    emptyComments: 'No comments for this selection yet.',
    emptyCompletedTasks: 'No completed tasks yet.',
    emptyTasks: 'No active tasks. Click Add to create one.',
    emptyTodayGoals: 'No goals for today.',
    export: 'Export',
    exportJson: 'Export JSON',
    exportPng: 'Export PNG',
    exportPromptForCodex: 'Export prompt for Codex',
    externalLibraries: 'External Libraries',
    externalLibrariesHint: 'Search public Excalidraw libraries and add them to this canvas directly.',
    findConflict: 'Find conflict',
    findPattern: 'Find pattern',
    future: 'Future',
    generateTasks: 'Generate tasks',
    history: 'History',
    hideLibraryPanel: 'Hide AI panel',
    hideProjectPanel: 'Hide project panel',
    language: '中文',
    lastBoardCannotDelete: 'Last board cannot be deleted',
    library: 'Library',
    librariesTab: 'Libraries',
    libraryAdded: 'Library added',
    libraryAddFailed: 'Could not add library',
    libraryLoading: 'Loading public libraries...',
    libraryItems: 'library items',
    maxQuestionPlaceholder: 'Fill in the biggest design question',
    moveProjectDown: 'Move project down',
    moveProjectUp: 'Move project up',
    myLibrary: 'My Library',
    newCanvas: 'New Canvas',
    noUpdates: 'No updates',
    noLibraryItems: 'No saved library items yet.',
    openExcalidrawLibrary: 'Open Excalidraw Library',
    openExternalLibraries: 'Open External Libraries',
    overview: 'Overview',
    projectEvolutionTree: 'Project Evolution Tree',
    projectProgress: 'Project Progress',
    recentBoards: 'Recent Boards',
    readOnly: 'Read only',
    rename: 'Rename',
    resume: 'Resume work',
    resumeOpenBoard: 'Open board',
    rework: 'Rework',
    restore: 'Restore',
    share: 'Share',
    shareLink: 'Share link',
    settings: 'Settings',
    saveCloud: 'Save cloud',
    showLibraryPanel: 'Show AI panel',
    showProjectPanel: 'Show project panel',
    selectedAsset: 'Selected asset',
    selectedContext: 'Selected context',
    selectAsset: 'Select a UI asset',
    selectAssetHint: 'Pick a screenshot or link to rename it and write analysis.',
    selectAll: 'Select all',
    showBoards: 'Show boards',
    hideBoards: 'Hide boards',
    searchLibraries: 'Search libraries...',
    stageHint: 'Click the project evolution tree below to update the current stage.',
    todayAddedNodes: 'Added Nodes Today',
    todayGoals: 'Today Goals',
    todayTasks: 'Today Tasks',
    tool: 'Tool',
    toolbox: 'Open Source Toolbox',
    trash: 'Trash',
    trashEmpty: 'Trash is empty.',
    askAiPlaceholder: 'Ask about the selected canvas context...',
    compareSelected: 'Compare selected',
    feedbackPlaceholder: 'Record what feedback they gave...',
    summarizeCanvas: 'Summarize canvas',
    insertAnalysisNode: 'Insert analysis node',
    importedTools: 'Tools saved',
    pasteToolsHint: 'Paste one link or a batch of links. Each URL becomes a saved tool automatically.',
    pasteToolsPlaceholder: 'Paste links here, one per line or as a paragraph...',
  },
  zh: {
    addProject: '添加项目',
    add: '添加',
    addCanvas: '添加画布',
    addSelectedScreenshot: '添加选中截图',
    analyze: '分析',
    aiAnalysis: 'AI 分析',
    analyzeSelected: '分析选中内容',
    aiPartner: 'AI 伙伴',
    aiSuggestions: 'AI 建议',
    analysisPanel: '分析面板',
    assets: '个资产',
    assetsTab: '资产',
    biggestQuestion: '当前最大问题',
    boards: '画布',
    cancel: '取消',
    canvas: '画布',
    canvasStatus: 'Excalidraw 画布 · 截图会自动进入资产库',
    collaborator: '反馈人',
    collaboratorNotes: '协作者反馈',
    commentPlaceholder: '给当前选中的节点写评论...',
    comments: '评论',
    completedTasks: '已完成任务',
    copiedReadOnlyLink: '已复制只读链接',
    cloudError: '云端保存失败',
    cloudLoading: '读取云端',
    cloudLocalOnly: '仅本地',
    cloudSaving: '保存云端',
    cloudSynced: '已同步云端',
    current: '当前',
    currentStage: '当前阶段',
    delete: '删除',
    deleteCanvas: '移到垃圾桶',
    deleteForever: '永久删除',
    deleteSelected: '删除选中',
    done: '完成',
    emptyAssets: '还没有资产',
    emptyAssetsHint: '截图或粘贴网页链接到 Canvas 后会自动缓存到这里。',
    emptyCollaboratorNotes: '还没有协作者反馈。',
    emptyComments: '当前选择还没有评论。',
    emptyCompletedTasks: '还没有已完成任务。',
    emptyTasks: '暂无进行中的任务，点击 Add 添加。',
    emptyTodayGoals: '还没有今日任务。',
    export: '导出',
    exportJson: '导出 JSON',
    exportPng: '导出 PNG',
    exportPromptForCodex: '导出 Codex Prompt',
    externalLibraries: '外部素材库',
    externalLibrariesHint: '直接搜索 Excalidraw 公共素材库，并加入当前 Canvas 的 Library。',
    findConflict: '查找冲突',
    findPattern: '查找模式',
    future: '未来',
    generateTasks: '生成任务',
    history: '历史',
    hideLibraryPanel: '隐藏 AI 面板',
    hideProjectPanel: '隐藏项目栏',
    language: 'EN',
    lastBoardCannotDelete: '最后一个画布不能删除',
    library: '素材库',
    librariesTab: '素材库',
    libraryAdded: '素材库已加入',
    libraryAddFailed: '素材库加入失败',
    libraryLoading: '正在加载公共素材库...',
    libraryItems: '个素材',
    maxQuestionPlaceholder: '填写当前最大设计问题',
    moveProjectDown: '项目下移',
    moveProjectUp: '项目上移',
    myLibrary: '我的素材库',
    newCanvas: '新建画布',
    noUpdates: '暂无更新',
    noLibraryItems: '还没有保存的素材。',
    openExcalidrawLibrary: '打开 Excalidraw 素材库',
    openExternalLibraries: '打开外部素材库',
    overview: '总览',
    projectEvolutionTree: '项目进化树',
    projectProgress: '项目进度',
    recentBoards: '最近画布',
    readOnly: '只读',
    rename: '重命名',
    resume: '继续上次工作',
    resumeOpenBoard: '打开画布',
    rework: '重做',
    restore: '恢复',
    share: '分享',
    shareLink: '复制只读链接',
    settings: '设置',
    saveCloud: '保存云端',
    showLibraryPanel: '显示 AI 面板',
    showProjectPanel: '显示项目栏',
    selectedAsset: '已选资产',
    selectedContext: '已选上下文',
    selectAsset: '选择一个 UI 资产',
    selectAssetHint: '选择截图或链接后，可以重命名并编写分析。',
    selectAll: '全选',
    showBoards: '展开画布',
    hideBoards: '折叠画布',
    searchLibraries: '搜索素材库...',
    stageHint: '点击下方项目进化树即可更新当前阶段。',
    todayAddedNodes: '新增节点（今日）',
    todayGoals: '今日目标',
    todayTasks: '今日任务',
    tool: '工具',
    toolbox: '工具箱（Open Source）',
    trash: '垃圾桶',
    trashEmpty: '垃圾桶为空。',
    askAiPlaceholder: '询问当前选中的画布上下文...',
    compareSelected: '对比选中内容',
    feedbackPlaceholder: '记录对方给了什么反馈...',
    summarizeCanvas: '总结画布',
    insertAnalysisNode: '插入分析节点',
    importedTools: '工具已保存',
    pasteToolsHint: '粘贴一个链接或一整段链接，每个 URL 会自动保存成工具。',
    pasteToolsPlaceholder: '把链接粘贴到这里，可以一行一个，也可以整段粘贴...',
  },
} satisfies Record<Language, Record<string, string>>

const stageLabels: Record<Language, Record<ProjectStageName, string>> = {
  en: {
    Idea: 'Idea',
    Research: 'Research',
    Blueprint: 'Blueprint',
    Prototype: 'Prototype',
    Build: 'Build',
    Iterate: 'Iterate',
    Launch: 'Launch',
  },
  zh: {
    Idea: '灵感',
    Research: '研究',
    Blueprint: '蓝图',
    Prototype: '原型',
    Build: '开发',
    Iterate: '迭代',
    Launch: '发布',
  },
}

const stageStatusLabels: Record<Language, Record<ProjectStageStatus, string>> = {
  en: {
    'Not Started': '⏳ Not Started',
    'In Progress': '🔄 In Progress',
    Done: '✅ Done',
    Revisit: '🔁 Revisit',
  },
  zh: {
    'Not Started': '⏳ 未开始',
    'In Progress': '🔄 进行中',
    Done: '✅ 完成',
    Revisit: '🔁 需要回头调整',
  },
}

const nodeStatLabels: Record<Language, Record<string, string>> = {
  en: {
    screenshots: 'screenshots',
    links: 'links',
    notes: 'notes',
    canvasElements: 'canvas elements',
    aiAnalysis: 'AI analysis results',
  },
  zh: {
    screenshots: '截图',
    links: '链接',
    notes: '笔记',
    canvasElements: '画布元素',
    aiAnalysis: 'AI 分析结果',
  },
}

const optionLabels = {
  en: {
    Research: 'Research',
    Canvas: 'Canvas',
    Code: 'Code',
    Design: 'Design',
    Review: 'Review',
    High: 'High',
    Medium: 'Medium',
    Low: 'Low',
    Todo: 'Todo',
    Doing: 'Doing',
    Done: 'Done',
    Saved: 'Saved',
    Studying: 'Studying',
    Using: 'Using',
    Later: 'Later',
    'New tool': 'New tool',
  },
  zh: {
    Research: '研究',
    Canvas: '画布',
    Code: '代码',
    Design: '设计',
    Review: '复盘',
    High: '高',
    Medium: '中',
    Low: '低',
    Todo: '待办',
    Doing: '进行中',
    Done: '完成',
    Saved: '已保存',
    Studying: '学习中',
    Using: '使用中',
    Later: '稍后',
    'New tool': '新工具',
  },
} satisfies Record<Language, Record<string, string>>

const localizeOption = (value: string, language: Language) => optionLabels[language][value] ?? value

const normalizeLocalizedOption = (value: string) => {
  const zhEntry = Object.entries(optionLabels.zh).find(([, label]) => label === value)
  return zhEntry?.[0] ?? value
}

const overviewCardDefaultWidths: Record<OverviewCardId, number> = {
  stage: 320,
  progress: 360,
  question: 360,
  goals: 320,
  timeline: 520,
  tasks: 760,
  completedTasks: 520,
  recent: 360,
  stats: 340,
  tools: 520,
  insights: 420,
}

const overviewCardMinWidths: Record<OverviewCardId, number> = {
  stage: 250,
  progress: 280,
  question: 280,
  goals: 250,
  timeline: 340,
  tasks: 420,
  completedTasks: 340,
  recent: 280,
  stats: 260,
  tools: 360,
  insights: 300,
}

function clampOverviewCardWidth(cardId: OverviewCardId, width: number) {
  const maxWidth = Math.max(overviewCardMinWidths[cardId], window.innerWidth - 96)
  return Math.min(Math.max(width, overviewCardMinWidths[cardId]), maxWidth)
}

function loadOverviewCardWidths() {
  try {
    const raw = window.localStorage.getItem(overviewCardWidthStorageKey)
    if (!raw) return overviewCardDefaultWidths
    const parsed = JSON.parse(raw) as Partial<Record<OverviewCardId, number>>
    return Object.fromEntries(
      (Object.keys(overviewCardDefaultWidths) as OverviewCardId[]).map((cardId) => [
        cardId,
        typeof parsed[cardId] === 'number'
          ? clampOverviewCardWidth(cardId, parsed[cardId])
          : overviewCardDefaultWidths[cardId],
      ]),
    ) as Record<OverviewCardId, number>
  } catch {
    return overviewCardDefaultWidths
  }
}

const trashRetentionDays = 7

const defaultBoardNames = ['Opportunity', 'Research Flow', 'Evidence', 'UI']
const projectStages: ProjectStageName[] = [
  'Idea',
  'Research',
  'Blueprint',
  'Prototype',
  'Build',
  'Iterate',
  'Launch',
]
const stageStatuses: ProjectStageStatus[] = ['Not Started', 'In Progress', 'Done', 'Revisit']
const normalizeStage = (stage?: string): ProjectStageName => {
  if (stage === 'Information Architecture') return 'Blueprint'
  if (stage === 'MVP') return 'Build'
  if (stage === 'Beta') return 'Iterate'
  return projectStages.includes(stage as ProjectStageName) ? stage as ProjectStageName : 'Idea'
}
const normalizeStageStatus = (status?: string): ProjectStageStatus =>
  stageStatuses.includes(status as ProjectStageStatus) ? status as ProjectStageStatus : 'Not Started'

const createStageStatuses = (
  currentStage: ProjectStageName,
  savedStatuses?: Partial<Record<ProjectStageName, ProjectStageStatus>>,
) => {
  const currentIndex = projectStages.indexOf(currentStage)
  return projectStages.reduce<Record<ProjectStageName, ProjectStageStatus>>((statuses, stage, index) => {
    statuses[stage] = savedStatuses?.[stage]
      ? normalizeStageStatus(savedStatuses[stage])
      : index < currentIndex
        ? 'Done'
        : index === currentIndex
          ? 'In Progress'
          : 'Not Started'
    return statuses
  }, {} as Record<ProjectStageName, ProjectStageStatus>)
}
const taskTypes: ProjectTask['type'][] = ['Research', 'Canvas', 'Code', 'Design', 'Review']
const taskPriorities: ProjectTask['priority'][] = ['High', 'Medium', 'Low']
const taskStatuses: ProjectTask['status'][] = ['Todo', 'Doing', 'Done']
const toolStatuses: ProjectTool['status'][] = ['Saved', 'Studying', 'Using', 'Later']

const makeId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const slugifyFileName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'canvas'

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const copyText = async (value: string) => {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.append(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

const hasIncomingLibraryImport = () => {
  const hash = new URLSearchParams(window.location.hash.slice(1))
  const search = new URLSearchParams(window.location.search)
  return hash.has('addLibrary') || search.has('addLibrary')
}

const safeWriteLocalStorage = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch (error) {
    console.warn('Could not persist workspace data locally.', error)
    return false
  }
}

const buildLibraryReturnUrl = (projectId: string, boardId: string) => {
  const url = new URL(window.location.href)
  url.hash = ''
  url.searchParams.set('mode', 'canvas')
  url.searchParams.set('project', projectId)
  url.searchParams.set('board', boardId)
  return url.toString()
}

const syncCanvasRoute = (projectId: string, boardId: string) => {
  const url = new URL(window.location.href)
  url.hash = ''
  url.searchParams.set('mode', 'canvas')
  url.searchParams.set('project', projectId)
  url.searchParams.set('board', boardId)
  window.history.replaceState({}, '', url.toString())
}

const publicLibrariesBaseUrl = 'https://libraries.excalidraw.com'

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

const makeLibraryId = (source: string) =>
  source.replace(/\//g, '-').replace(/\.excalidrawlib$/i, '')

const normalizeExternalLibraries = (items: Array<{
  name?: string
  description?: string
  itemNames?: string[]
  source?: string
  preview?: string
  downloads?: {
    total?: number
  }
}>) =>
  items
    .filter((item) => item.name && item.source)
    .map<ExternalLibrary>((item) => ({
      id: makeLibraryId(item.source ?? ''),
      name: item.name ?? 'Untitled library',
      description: stripHtml(item.description),
      itemNames: item.itemNames ?? [],
      sourceUrl: `${publicLibrariesBaseUrl}/libraries/${item.source}`,
      previewUrl: item.preview
        ? `${publicLibrariesBaseUrl}/libraries/${item.preview}`
        : '',
      downloads: item.downloads?.total,
    }))
    .sort((a, b) => (b.downloads ?? 0) - (a.downloads ?? 0))

const emptyCanvas = (): CanvasScene => ({
  elements: [],
  files: {},
})

const createDefaultBoards = (projectId: string, legacyCanvas?: CanvasScene): Board[] =>
  defaultBoardNames.map((name, index) => ({
    id: `${projectId}-${name.toLowerCase().replace(/\s+/g, '-')}`,
    name,
    canvas: index === 0 && legacyCanvas ? legacyCanvas : emptyCanvas(),
    updatedAt: new Date().toISOString(),
  }))

const createDefaultQuestion = (): ProjectQuestion => ({
  biggest_question: '',
  priority: 'Medium',
  updated_at: new Date().toISOString(),
})

const isBoardExpired = (board: Board) =>
  Boolean(board.deletedAt && Date.now() - new Date(board.deletedAt).getTime() > trashRetentionDays * 86_400_000)

const activeBoardsOf = (project: Project) => project.boards.filter((board) => !board.deletedAt)

const deletedBoardsOf = (project: Project) => project.boards.filter((board) => board.deletedAt && !isBoardExpired(board))

const firstActiveBoardOf = (project: Project) => activeBoardsOf(project)[0] ?? project.boards[0]

const ensureAlphaCompassArchitecture = (projectId: string, boards: Board[]) => {
  if (projectId !== 'alpha-compass') return boards

  return boards.map((board) => {
    if (board.id !== 'alpha-compass-ui' || hasAlphaCompassArchitecture(board.canvas)) return board

    return {
      ...board,
      canvas: {
        elements: [
          ...alphaCompassArchitectureCanvas.elements,
          ...board.canvas.elements,
        ],
        files: {
          ...alphaCompassArchitectureCanvas.files,
          ...board.canvas.files,
        },
      },
      updatedAt: new Date().toISOString(),
    }
  })
}

const normalizeProject = (project: Project): Project => {
  const boards = project.boards?.length
    ? project.boards
      .filter((board) => !isBoardExpired(board))
      .map((board) => ({
        ...board,
        updatedAt: board.updatedAt ?? new Date().toISOString(),
      }))
    : createDefaultBoards(project.id, project.canvas)
  const activeBoards = boards.filter((board) => !board.deletedAt)
  const normalizedBoards = ensureAlphaCompassArchitecture(
    project.id,
    activeBoards.length ? boards : createDefaultBoards(project.id, project.canvas),
  )
  const activeBoardId = normalizedBoards.some((board) => board.id === project.activeBoardId && !board.deletedAt)
    ? project.activeBoardId
    : project.id === 'alpha-compass'
      ? 'alpha-compass-ui'
      : normalizedBoards.find((board) => !board.deletedAt)?.id
  const currentStage = normalizeStage(project.currentStage)
  const stageStatuses = createStageStatuses(currentStage, project.stageStatuses)
  const tools = (project.tools ?? []).map((tool) => {
    const normalizedUrl = normalizeUrl(tool.url) ?? tool.url
    return {
      ...tool,
      url: normalizedUrl,
      icon_url: tool.icon_url || getToolIconUrl(normalizedUrl),
    }
  })

  if (project.boards?.length) {
    return {
      ...project,
      boards: normalizedBoards,
      activeBoardId: activeBoardId ?? normalizedBoards[0].id,
      currentStage,
      stageStatuses,
      stageUpdatedAt: project.stageUpdatedAt ?? new Date().toISOString(),
      biggestQuestion: project.biggestQuestion ?? createDefaultQuestion(),
      tasks: project.tasks ?? [],
      canvasNodes: project.canvasNodes ?? [],
      tools,
      insights: project.insights ?? [],
      comments: project.comments ?? [],
      collaboratorNotes: project.collaboratorNotes ?? [],
    }
  }

  return {
    ...project,
    boards: normalizedBoards,
    activeBoardId: normalizedBoards[0].id,
    canvas: undefined,
    currentStage,
    stageStatuses,
    stageUpdatedAt: project.stageUpdatedAt ?? new Date().toISOString(),
    biggestQuestion: project.biggestQuestion ?? createDefaultQuestion(),
    tasks: project.tasks ?? [],
    canvasNodes: project.canvasNodes ?? [],
    tools,
    insights: project.insights ?? [],
    comments: project.comments ?? [],
    collaboratorNotes: project.collaboratorNotes ?? [],
  }
}

const getMimeType = (dataURL: string) => {
  const match = dataURL.match(/^data:([^;]+);/)
  return match?.[1] || 'image/png'
}

const getImageSize = (src: string) =>
  new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth || 960, height: image.naturalHeight || 600 })
    image.onerror = () => resolve({ width: 960, height: 600 })
    image.src = src
  })

const normalizeImageSize = ({ width, height }: { width: number; height: number }) => {
  const maxWidth = 420
  const scale = width > maxWidth ? maxWidth / width : 1
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  }
}

const normalizeUrl = (value: string) => {
  const trimmed = value.trim().replace(/[)\],.;!?，。；！？]+$/g, '')
  if (!trimmed) return null

  const hasProtocol = /^https?:\/\//i.test(trimmed)
  const looksLikeUrl =
    hasProtocol ||
    /^localhost(:\d+)?(\/|$)/i.test(trimmed) ||
    /^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/|$)/.test(trimmed) ||
    /^[^\s]+\.[^\s]{2,}/.test(trimmed)
  if (!looksLikeUrl) return null

  const withProtocol = hasProtocol ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withProtocol)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

const getToolTitleFromUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    const pathSegment = parsed.pathname.split('/').filter(Boolean)[0]
    return pathSegment
      ? `${host}/${decodeURIComponent(pathSegment).slice(0, 32)}`
      : host
  } catch {
    return url
  }
}

const getToolIconUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return ''
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(parsed.hostname)}&sz=64`
  } catch {
    return ''
  }
}

const extractToolLinks = (text: string) => {
  const lines = text.split(/\n+/)
  const entries: Array<{ url: string; label: string }> = []
  const seen = new Set<string>()

  lines.forEach((line) => {
    const matches = line.match(/https?:\/\/[^\s<>"']+|(?:www\.)?[a-z0-9][a-z0-9.-]*\.[a-z]{2,}[^\s<>"']*/gi) ?? []
    matches.forEach((match) => {
      const url = normalizeUrl(match)
      if (!url || seen.has(url)) return
      seen.add(url)
      const label = line
        .replace(match, '')
        .replace(/^[\s:：\-–—|]+|[\s:：\-–—|]+$/g, '')
        .trim()

      entries.push({
        url,
        label,
      })
    })
  })

  return entries
}

const createUrlEmbedElement = (url: string, existingCount: number): ExcalidrawElement => {
  const id = `url-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  const x = 120 + (existingCount % 3) * 520
  const y = 120 + Math.floor(existingCount / 3) * 420

  return {
    id,
    type: 'embeddable',
    x,
    y,
    width: 480,
    height: 320,
    angle: 0,
    strokeColor: '#1e1e1e',
    backgroundColor: 'transparent',
    fillStyle: 'solid',
    strokeWidth: 2,
    strokeStyle: 'solid',
    roughness: 1,
    opacity: 100,
    roundness: {
      type: 3,
    },
    seed: Math.floor(Math.random() * 2 ** 31),
    version: 1,
    versionNonce: Math.floor(Math.random() * 2 ** 31),
    index: null,
    isDeleted: false,
    groupIds: [],
    frameId: null,
    boundElements: null,
    updated: Date.now(),
    link: url,
    locked: false,
  } as ExcalidrawElement
}

const createAssetImageScene = async (
  asset: ResearchAsset,
  existingCount: number,
): Promise<{
  element: ExcalidrawElement
  file: BinaryFileData
}> => {
  const naturalSize = await getImageSize(asset.image)
  const size = normalizeImageSize(naturalSize)
  const fileId = `${asset.id}-file` as FileId
  const x = 120 + (existingCount % 4) * 470
  const y = 120 + Math.floor(existingCount / 4) * 360
  const [element] = convertToExcalidrawElements(
    [
      {
        type: 'image',
        id: `${asset.id}-image`,
        fileId,
        x,
        y,
        width: size.width,
        height: size.height,
        status: 'saved',
      },
    ],
    { regenerateIds: false },
  )

  return {
    element,
    file: {
      id: fileId,
      dataURL: asset.image as BinaryFileData['dataURL'],
      mimeType: getMimeType(asset.image) as BinaryFileData['mimeType'],
      created: Date.now(),
      lastRetrieved: Date.now(),
    },
  }
}

const getLibraryItemsSignature = (items: LibraryItems = []) =>
  items
    .map((item) => `${item.id}:${item.name ?? ''}:${item.status}:${item.elements.map((element) => `${element.id}:${element.type}:${element.version}`).join(',')}`)
    .join('|')

const getSceneSignature = (scene: CanvasScene) =>
  JSON.stringify({
    elements: scene.elements.map((element) => ({
      id: element.id,
      type: element.type,
      x: Math.round(element.x),
      y: Math.round(element.y),
      width: Math.round(element.width),
      height: Math.round(element.height),
      angle: element.angle,
      strokeColor: element.strokeColor,
      backgroundColor: element.backgroundColor,
      opacity: element.opacity,
      isDeleted: element.isDeleted,
      groupIds: element.groupIds,
      fileId: getElementFileId(element),
      link: getElementLink(element),
      text: getElementText(element),
    })),
    files: Object.keys(scene.files).sort(),
  })

const createBlankAnalysis = (title: string): Analysis => ({
  task: `${title} 还没有分析，先记录它解决的用户任务。`,
  nextClick: '观察主要按钮、焦点区域和用户下一步最可能的动作。',
  hierarchy: '记录页面中最强、次强和辅助信息的层级关系。',
  pattern: '标注它属于哪一种交互模式。',
  borrow: '写下可以借鉴到自己项目里的结构或节奏。',
  avoid: '写下不应该直接照搬的视觉、信息密度或业务假设。',
})

const getElementText = (element: ExcalidrawElement) =>
  typeof (element as { text?: unknown }).text === 'string'
    ? (element as { text: string }).text
    : ''

const getElementLink = (element: ExcalidrawElement) =>
  typeof (element as { link?: unknown }).link === 'string'
    ? (element as { link: string }).link
    : ''

const getElementFileId = (element: ExcalidrawElement) =>
  typeof (element as { fileId?: unknown }).fileId === 'string'
    ? (element as { fileId: string }).fileId
    : ''

const findAssetForElement = (element: ExcalidrawElement, assets: ResearchAsset[]) => {
  const fileId = getElementFileId(element)
  return assets.find((asset) =>
    asset.id === `asset-${element.id}` ||
    element.id === `${asset.id}-image` ||
    fileId === `${asset.id}-file` ||
    asset.source === getElementLink(element)
  )
}

const summarizeSelectedElements = (elements: readonly ExcalidrawElement[], assets: ResearchAsset[]) =>
  elements.map((element, index) => {
    const asset = findAssetForElement(element, assets)
    const text = getElementText(element)
    const link = getElementLink(element)
    return {
      id: element.id,
      label: asset?.title || text || link || `${element.type} ${index + 1}`,
      type: element.type,
      text,
      link,
      assetTitle: asset?.title,
      assetSource: asset?.source,
    }
  })

const createAiFallback = ({
  action,
  question,
  selectedCount,
  canvasCount,
  language,
}: {
  action: AiAction
  question: string
  selectedCount: number
  canvasCount: number
  language: Language
}) => {
  const actionLabel = {
    analyze: language === 'en' ? 'Analysis' : '分析',
    compare: language === 'en' ? 'Comparison' : '对比',
    summarize: language === 'en' ? 'Canvas summary' : '画布总结',
    pattern: language === 'en' ? 'Pattern' : '模式',
    conflict: language === 'en' ? 'Conflict check' : '冲突检查',
    tasks: language === 'en' ? 'Generated tasks' : '生成任务',
    codexPrompt: language === 'en' ? 'Codex prompt' : 'Codex Prompt',
  } satisfies Record<AiAction, string>

  if (language === 'en') {
    return `${actionLabel[action]}: ${selectedCount ? `${selectedCount} selected canvas item(s)` : 'No specific item selected'} inside a canvas with ${canvasCount} elements.\n\nFocus:\n- Clarify what task this context supports.\n- Identify the visible interaction pattern.\n- Note reusable structure and possible conflicts.\n- Convert the next step into a concrete task.\n\nUser question: ${question || 'No extra question provided.'}`
  }

  return `${actionLabel[action]}：当前${selectedCount ? `选中了 ${selectedCount} 个画布元素` : '没有选中特定元素'}，画布共有 ${canvasCount} 个元素。\n\n重点：\n- 判断这组内容解决什么用户任务。\n- 识别可复用的交互模式。\n- 标出可能冲突或需要回头调整的地方。\n- 把下一步转成具体任务。\n\n用户问题：${question || '没有额外问题。'}`
}

const formatAssetTime = () => {
  const date = new Date()
  return `${date.toISOString().slice(0, 10)} ${date.toTimeString().slice(0, 5)}`
}

const createWebsiteTitle = (url: string) => {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname === '/' ? '' : parsed.pathname.split('/').filter(Boolean).slice(0, 2).join(' / ')
    return path ? `${parsed.hostname} · ${path}` : parsed.hostname
  } catch {
    return url
  }
}

const escapeSvgText = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

const createWebsiteThumbnail = (url: string) => {
  const title = createWebsiteTitle(url)
  const subtitle = (() => {
    try {
      return new URL(url).origin
    } catch {
      return url
    }
  })()
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400">
      <rect width="640" height="400" rx="24" fill="#f8fafc"/>
      <rect x="42" y="46" width="556" height="308" rx="18" fill="#ffffff" stroke="#dbe4ee"/>
      <rect x="42" y="46" width="556" height="48" rx="18" fill="#e8f6f1"/>
      <circle cx="76" cy="70" r="7" fill="#0a9379"/>
      <circle cx="100" cy="70" r="7" fill="#94a3b8"/>
      <circle cx="124" cy="70" r="7" fill="#cbd5e1"/>
      <rect x="72" y="134" width="224" height="20" rx="10" fill="#0f172a"/>
      <rect x="72" y="174" width="430" height="12" rx="6" fill="#94a3b8"/>
      <rect x="72" y="202" width="338" height="12" rx="6" fill="#cbd5e1"/>
      <rect x="72" y="254" width="154" height="42" rx="12" fill="#0a9379"/>
      <text x="72" y="330" fill="#64748b" font-family="Arial, sans-serif" font-size="18">${escapeSvgText(subtitle)}</text>
      <text x="72" y="151" fill="#0f172a" font-family="Arial, sans-serif" font-size="20" font-weight="700">${escapeSvgText(title)}</text>
    </svg>
  `
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

const createUrlAsset = (url: string): ResearchAsset => {
  const title = createWebsiteTitle(url)
  return {
    id: makeId('asset-link'),
    title,
    source: url,
    image: createWebsiteThumbnail(url),
    tags: ['Website', 'Link'],
    status: 'manual',
    analysis: createBlankAnalysis(title),
  }
}

const createScreenshotAsset = (element: ExcalidrawElement, files: BinaryFiles): ResearchAsset | null => {
  const fileId = (element as { fileId?: string }).fileId
  if (!fileId) return null

  const file = files[fileId]
  if (!file?.dataURL) return null

  const title = `Screenshot ${formatAssetTime()}`
  return {
    id: `asset-${element.id}`,
    title,
    source: 'Manual screenshot',
    image: file.dataURL,
    tags: ['Screenshot', 'Canvas'],
    status: 'manual',
    analysis: createBlankAnalysis(title),
  }
}

const createSeedWorkspaceState = (): WorkspaceState => ({
  projects: seedProjects.map(normalizeProject),
})

const normalizeWorkspaceState = (workspaceState: WorkspaceState): WorkspaceState => ({
  ...workspaceState,
  projects: workspaceState.projects.map(normalizeProject),
})

function useWorkspaceState(): [WorkspaceState, (next: WorkspaceState) => void, CloudSyncStatus, () => Promise<void>] {
  const [state, setState] = useState<WorkspaceState>(createSeedWorkspaceState)
  const [cloudSync, setCloudSync] = useState<CloudSyncStatus>({
    enabled: isCloudWorkspaceEnabled,
    status: isCloudWorkspaceEnabled ? 'loading' : 'local',
  })

  useEffect(() => {
    let cancelled = false

    if (!isCloudWorkspaceEnabled) return undefined

    loadCloudWorkspace()
      .then((cloudState) => {
        if (cancelled) return

        if (!cloudState?.projects?.length) {
          setCloudSync({
            enabled: true,
            status: 'synced',
            updatedAt: new Date().toISOString(),
          })
          return
        }

        const normalizedCloudState = normalizeWorkspaceState(cloudState)
        setState(normalizedCloudState)
        setCloudSync({
          enabled: true,
          status: 'synced',
          updatedAt: new Date().toISOString(),
        })
      })
      .catch((error) => {
        console.warn('Could not load cloud workspace.', error)
        setCloudSync({
          enabled: true,
          status: 'error',
          updatedAt: new Date().toISOString(),
        })
      })

    return () => {
      cancelled = true
    }
  }, [])

  const save = (next: WorkspaceState) => {
    setState(next)
    if (!isCloudWorkspaceEnabled) {
      setCloudSync({
        enabled: false,
        status: 'local',
      })
      return
    }

    setCloudSync({
      enabled: true,
      status: 'saving',
      updatedAt: new Date().toISOString(),
    })
    saveCloudWorkspace(next)
      .then(() => {
        setCloudSync({
          enabled: true,
          status: 'synced',
          updatedAt: new Date().toISOString(),
        })
      })
      .catch((error) => {
        console.warn('Could not save cloud workspace.', error)
        setCloudSync({
          enabled: true,
          status: 'error',
          updatedAt: new Date().toISOString(),
        })
      })
  }

  const saveCloudNow = async () => {
    if (!isCloudWorkspaceEnabled) {
      setCloudSync({
        enabled: false,
        status: 'local',
      })
      return
    }

    setCloudSync({
      enabled: true,
      status: 'saving',
      updatedAt: new Date().toISOString(),
    })
    try {
      await saveCloudWorkspace(state)
      setCloudSync({
        enabled: true,
        status: 'synced',
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.warn('Could not save cloud workspace.', error)
      setCloudSync({
        enabled: true,
        status: 'error',
        updatedAt: new Date().toISOString(),
      })
    }
  }

  return [state, save, cloudSync, saveCloudNow]
}

function ProjectRail({
  projects,
  activeProjectId,
  activeBoardId,
  language,
  mode,
  onCreateBoard,
  onCreateProject,
  onDeleteBoard,
  onDeleteProject,
  onDeleteBoardForever,
  onHidePanel,
  onOpenBoardMenu,
  onModeChange,
  onMoveProject,
  onRenameBoard,
  onRenameProject,
  onRestoreBoard,
  onSelectBoard,
  onSelectProject,
  onToggleLanguage,
}: {
  projects: Project[]
  activeProjectId: string
  activeBoardId: string
  language: Language
  mode: 'overview' | 'canvas'
  onCreateBoard: (projectId: string) => void
  onCreateProject: () => void
  onDeleteBoard: (projectId: string, boardId: string) => void
  onDeleteProject: (projectId: string) => void
  onDeleteBoardForever: (projectId: string, boardId: string) => void
  onHidePanel: () => void
  onOpenBoardMenu: (event: MouseEvent, projectId: string, boardId: string) => void
  onModeChange: (mode: 'overview' | 'canvas') => void
  onMoveProject: (projectId: string, direction: -1 | 1) => void
  onRenameBoard: (projectId: string, boardId: string, name: string) => void
  onRenameProject: (projectId: string, name: string) => void
  onRestoreBoard: (projectId: string, boardId: string) => void
  onSelectBoard: (projectId: string, boardId: string) => void
  onSelectProject: (id: string) => void
  onToggleLanguage: () => void
}) {
  const t = copy[language]
  const projectDots = ['#18a879', '#7c5cff', '#3478f6', '#ff8a1f']
  const [editingProjectId, setEditingProjectId] = useState<string>()
  const [projectNameDraft, setProjectNameDraft] = useState('')
  const [editingBoardId, setEditingBoardId] = useState<string>()
  const [boardNameDraft, setBoardNameDraft] = useState('')
  const [collapsedProjectIds, setCollapsedProjectIds] = useState<Set<string>>(() => new Set())

  const toggleProjectBoards = (projectId: string) => {
    setCollapsedProjectIds((current) => {
      const next = new Set(current)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }

  const startEditingProject = (project: Project) => {
    setEditingProjectId(project.id)
    setProjectNameDraft(project.name)
  }

  const saveProjectName = () => {
    if (!editingProjectId) return
    const nextName = projectNameDraft.trim()
    if (!nextName) return
    onRenameProject(editingProjectId, nextName)
    setEditingProjectId(undefined)
    setProjectNameDraft('')
  }

  const cancelProjectEdit = () => {
    setEditingProjectId(undefined)
    setProjectNameDraft('')
  }

  const startEditingBoard = (board: Board) => {
    setEditingBoardId(board.id)
    setBoardNameDraft(board.name)
  }

  const saveBoardName = (projectId: string) => {
    if (!editingBoardId) return
    const nextName = boardNameDraft.trim()
    if (!nextName) return
    onRenameBoard(projectId, editingBoardId, nextName)
    setEditingBoardId(undefined)
    setBoardNameDraft('')
  }

  const cancelBoardEdit = () => {
    setEditingBoardId(undefined)
    setBoardNameDraft('')
  }

  return (
    <aside className="project-rail" aria-label="Projects">
      <div className="brand">
        <div className="brand-mark">IR</div>
        <div>
          <strong>Interaction Research</strong>
          <span>Workspace</span>
        </div>
        <button aria-label={t.hideProjectPanel} className="panel-toggle-button" onClick={onHidePanel} type="button">
          <PanelLeft size={16} />
        </button>
      </div>

      <div className="project-switcher">
        <span className="switcher-dot">P</span>
        <strong>{projects.find((project) => project.id === activeProjectId)?.name}</strong>
        <span>⌄</span>
      </div>

      <button className="language-toggle" onClick={onToggleLanguage} type="button">
        {t.language}
      </button>

      <nav className="side-nav" aria-label="Main navigation">
        <button className={mode === 'overview' ? 'active' : ''} onClick={() => onModeChange('overview')} type="button">
          <Home size={17} />
          {t.overview}
        </button>
        <button className={mode === 'canvas' ? 'active' : ''} onClick={() => onModeChange('canvas')} type="button">
          <Grid2X2 size={17} />
          {t.canvas}
        </button>
        <button type="button">
          <History size={17} />
          {t.history}
        </button>
        <button type="button">
          <Settings size={17} />
          {t.settings}
        </button>
      </nav>

      <div className="project-list-head">
        <span>{language === 'en' ? 'Projects' : '项目'}</span>
        <button onClick={onCreateProject} type="button" aria-label={t.addProject}>
          <Plus size={15} />
        </button>
      </div>

      <div className="project-list">
        {projects.map((project, index) => {
          const isCollapsed = collapsedProjectIds.has(project.id)

          return (
          <div className={`project-group ${activeProjectId === project.id ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`} key={project.id}>
            <div className="project-row">
              <button
                aria-label={`${isCollapsed ? t.showBoards : t.hideBoards} ${project.name}`}
                className="project-collapse-toggle"
                onClick={() => toggleProjectBoards(project.id)}
                type="button"
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>
              <button
                className="project-item"
                onDoubleClick={() => startEditingProject(project)}
                onClick={() => onSelectProject(project.id)}
                type="button"
              >
                <span className="project-dot" style={{ background: projectDots[index % projectDots.length] }} />
                <strong>{project.name}</strong>
              </button>
              <div className="project-move-actions" aria-label={`${project.name} order`}>
                <button
                  aria-label={`${t.moveProjectUp} ${project.name}`}
                  disabled={index === 0}
                  onClick={() => onMoveProject(project.id, -1)}
                  type="button"
                >
                  <ArrowUp size={12} />
                </button>
                <button
                  aria-label={`${t.moveProjectDown} ${project.name}`}
                  disabled={index === projects.length - 1}
                  onClick={() => onMoveProject(project.id, 1)}
                  type="button"
                >
                  <ArrowDown size={12} />
                </button>
              </div>
              <button
                aria-label={`${t.addCanvas} ${project.name}`}
                className="project-board-add"
                onClick={() => onCreateBoard(project.id)}
                type="button"
              >
                <Plus size={14} />
              </button>
            </div>
            {editingProjectId === project.id ? (
              <div className="project-edit-panel">
                <input
                  aria-label={`Rename ${project.name}`}
                  autoFocus
                  onChange={(event) => setProjectNameDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') saveProjectName()
                    if (event.key === 'Escape') cancelProjectEdit()
                  }}
                  value={projectNameDraft}
                />
                <div>
                  <button onClick={saveProjectName} type="button">{t.rename}</button>
                  <button onClick={cancelProjectEdit} type="button">{t.cancel}</button>
                  <button
                    className="danger"
                    disabled={projects.length <= 1}
                    onClick={() => {
                      onDeleteProject(project.id)
                      cancelProjectEdit()
                    }}
                    type="button"
                  >
                    {t.delete}
                  </button>
                </div>
              </div>
            ) : null}
            {!isCollapsed ? (
            <div className="project-board-list">
              {activeBoardsOf(project).map((board) => (
                <div className="project-board-entry" key={board.id}>
                <button
                  className={project.id === activeProjectId && board.id === activeBoardId && mode === 'canvas' ? 'active' : ''}
                  onDoubleClick={() => startEditingBoard(board)}
                  onContextMenu={(event) => onOpenBoardMenu(event, project.id, board.id)}
                  onClick={() => onSelectBoard(project.id, board.id)}
                  type="button"
                >
                  <span />
                  {board.name}
                </button>
                {editingBoardId === board.id ? (
                  <div className="board-edit-panel">
                    <input
                      aria-label={`Rename ${board.name}`}
                      autoFocus
                      onChange={(event) => setBoardNameDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') saveBoardName(project.id)
                        if (event.key === 'Escape') cancelBoardEdit()
                      }}
                      value={boardNameDraft}
                    />
                    <div>
                      <button onClick={() => saveBoardName(project.id)} type="button">{t.rename}</button>
                      <button onClick={cancelBoardEdit} type="button">{t.cancel}</button>
                      <button
                        className="danger"
                        disabled={activeBoardsOf(project).length <= 1}
                        onClick={() => {
                          onDeleteBoard(project.id, board.id)
                          cancelBoardEdit()
                        }}
                        type="button"
                      >
                        {t.delete}
                      </button>
                    </div>
                  </div>
                ) : null}
                </div>
              ))}
            </div>
            ) : null}
            {!isCollapsed && deletedBoardsOf(project).length ? (
              <details className="board-trash">
                <summary>{t.trash} · {deletedBoardsOf(project).length}</summary>
                {deletedBoardsOf(project).map((board) => (
                  <div className="trash-row" key={board.id}>
                    <span>{board.name}</span>
                    <button onClick={() => onRestoreBoard(project.id, board.id)} type="button">{t.restore}</button>
                    <button className="danger" onClick={() => onDeleteBoardForever(project.id, board.id)} type="button">
                      {t.deleteForever}
                    </button>
                  </div>
                ))}
              </details>
            ) : null}
          </div>
          )
        })}
      </div>

      <div className="user-profile">
        <div className="avatar">Q</div>
        <div>
          <strong>Qiuyi Ye</strong>
          <span>Pro Plan</span>
        </div>
        <span>⌄</span>
      </div>
    </aside>
  )
}

function TopBar({
  cloudSync,
  language,
  isReadOnly,
  project,
  onCreateBoard,
  onExportJson,
  onExportPng,
  onSaveCloud,
  onShareLink,
}: {
  cloudSync: CloudSyncStatus
  language: Language
  isReadOnly: boolean
  project: Project
  onCreateBoard: () => void
  onExportJson: () => void
  onExportPng: () => void
  onSaveCloud: () => void
  onShareLink: () => void
}) {
  const t = copy[language]
  const cloudLabel = cloudSync.status === 'loading'
    ? t.cloudLoading
    : cloudSync.status === 'saving'
      ? t.cloudSaving
      : cloudSync.status === 'synced'
        ? t.cloudSynced
        : cloudSync.status === 'error'
          ? t.cloudError
          : t.cloudLocalOnly

  return (
    <header className="top-bar">
      <div>
        <h1>{project.name}</h1>
        <p>{language === 'en' ? 'An exploratory investing operating system for building investor confidence.' : '帮助普通投资者建立投资认知的探索式投资操作系统'}</p>
      </div>

      <div className="top-actions">
        {isReadOnly ? <span className="read-only-pill">{t.readOnly}</span> : null}
        <button
          className={`cloud-sync-pill ${cloudSync.status}`}
          disabled={isReadOnly || cloudSync.status === 'saving' || cloudSync.status === 'loading'}
          onClick={onSaveCloud}
          type="button"
        >
          <Globe2 size={15} />
          {cloudLabel}
        </button>
        <button onClick={onShareLink} type="button">
          <Share2 size={15} />
          {t.shareLink}
        </button>
        <button onClick={onExportPng} type="button">
          <Download size={15} />
          {t.exportPng}
        </button>
        <button onClick={onExportJson} type="button">
          <FileJson size={15} />
          {t.exportJson}
        </button>
        <button className="primary-action" disabled={isReadOnly} onClick={onCreateBoard} type="button">
          <Plus size={16} />
          {t.newCanvas}
        </button>
      </div>
    </header>
  )
}

function BoardTabs({
  project,
  activeBoardId,
  language,
  onOpenBoardMenu,
  onSelectBoard,
}: {
  project: Project
  activeBoardId: string
  language: Language
  onOpenBoardMenu: (event: MouseEvent, projectId: string, boardId: string) => void
  onSelectBoard: (boardId: string) => void
}) {
  const t = copy[language]
  const activeBoards = activeBoardsOf(project)
  const activeBoard = activeBoards.find((board) => board.id === activeBoardId) ?? activeBoards[0]

  return (
    <nav className="board-tabs" aria-label={`${project.name} boards`}>
      <div className="board-tabs-label">
        <ClipboardList size={15} />
        <span>
          <strong>{t.boards}</strong>
          <small>{project.name} · {activeBoard?.name ?? 'No canvas'}</small>
        </span>
      </div>
      <div className="board-tab-row">
        {activeBoards.map((board) => (
          <button
            className={board.id === activeBoardId ? 'active' : ''}
            aria-label={`Open ${board.name} in ${project.name}`}
            key={board.id}
            onContextMenu={(event) => onOpenBoardMenu(event, project.id, board.id)}
            onClick={() => onSelectBoard(board.id)}
            type="button"
          >
            {board.name}
          </button>
        ))}
      </div>
    </nav>
  )
}

const isToday = (value: string) => value.slice(0, 10) === new Date().toISOString().slice(0, 10)

const daysSince = (value?: string) => {
  if (!value) return Number.POSITIVE_INFINITY
  return Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000)
}

const countTodayNodes = (nodes: CanvasNode[] = []) => ({
  screenshots: nodes.filter((node) => node.type === 'screenshot' && isToday(node.created_at)).length,
  links: nodes.filter((node) => node.type === 'link' && isToday(node.created_at)).length,
  notes: nodes.filter((node) => node.type === 'note' && isToday(node.created_at)).length,
  canvasElements: nodes.filter((node) => node.type === 'canvas_element' && isToday(node.created_at)).length,
  aiAnalysis: nodes.filter((node) => node.type === 'ai_analysis' && isToday(node.created_at)).length,
})

const generateInsights = (project: Project, language: Language) => {
  const insights: string[] = []
  const nodes = project.canvasNodes ?? []
  const recentBoard = activeBoardsOf(project).sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime())[0]
  const canvasElements = nodes.filter((node) => node.type === 'canvas_element').length
  const links = nodes.filter((node) => node.type === 'link').length

  if (!(project.tasks ?? []).length) insights.push(language === 'en' ? 'Today task list is empty. Add 1-3 concrete actions for today.' : '今日任务为空，建议先添加 1-3 个今天要推进的动作。')
  if (daysSince(recentBoard?.updatedAt) > 7) insights.push(language === 'en' ? 'No canvas has been updated in the last 7 days. Continue one board.' : '最近 7 天没有更新 Canvas，建议继续推进一个画布。')
  if (daysSince(project.stageUpdatedAt) > 7) insights.push(language === 'en' ? 'The current stage has stayed unchanged for over 7 days. Check whether it can move forward.' : '当前阶段已停留超过 7 天，建议检查是否可以进入下一阶段。')
  if (canvasElements > 12 && links < 3) insights.push(language === 'en' ? 'There are many nodes but few connections. Organize relationships between nodes.' : '节点较多但连接偏少，建议整理节点之间的关系。')
  if (!project.biggestQuestion?.biggest_question.trim()) insights.push(language === 'en' ? 'The biggest question is empty. Fill in the main design question now.' : '当前最大问题为空，建议填写现在最需要回答的设计问题。')

  return insights.length ? insights : [language === 'en' ? 'Project status is clear. Continue the current board or narrow the next task.' : '项目状态清晰，可以继续推进当前画布或收敛下一步任务。']
}

function BoardPreview({ index }: { index: number }) {
  const previewClass = ['flow', 'evidence', 'architecture', 'journey'][index % 4]

  return (
    <div className={`board-preview ${previewClass}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  )
}

function OverviewDashboard({
  language,
  project,
  onAddTask,
  onAddTool,
  onCreateBoard,
  onDeleteTask,
  onDeleteTool,
  onOpenBoard,
  onSetStage,
  onSetStageStatus,
  onUpdateQuestion,
  onUpdateTask,
  onUpdateTool,
  onImportTools,
}: {
  language: Language
  project: Project
  onAddTask: () => void
  onAddTool: () => void
  onCreateBoard: () => void
  onDeleteTask: (taskId: string) => void
  onDeleteTool: (toolId: string) => void
  onOpenBoard: (boardId: string) => void
  onSetStage: (stage: ProjectStageName) => void
  onSetStageStatus: (stage: ProjectStageName, status: ProjectStageStatus) => void
  onUpdateQuestion: (question: ProjectQuestion) => void
  onUpdateTask: (taskId: string, updates: Partial<ProjectTask>) => void
  onUpdateTool: (toolId: string, updates: Partial<ProjectTool>) => void
  onImportTools: (text: string) => number
}) {
  const t = copy[language]
  const currentStage = normalizeStage(project.currentStage)
  const projectStageStatuses = createStageStatuses(currentStage, project.stageStatuses)
  const progress = Math.round((projectStages.filter((stage) => projectStageStatuses[stage] === 'Done').length / projectStages.length) * 100)
  const question = project.biggestQuestion ?? createDefaultQuestion()
  const recentBoards = [...project.boards]
    .filter((board) => !board.deletedAt)
    .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime())
    .slice(0, 5)
  const resumeBoard = project.boards.find((board) => board.id === project.activeBoardId && !board.deletedAt)
    ?? firstActiveBoardOf(project)
  const nodeStats = countTodayNodes(project.canvasNodes)
  const insights = generateInsights(project, language)
  const activeTasks = (project.tasks ?? []).filter((task) => task.status !== 'Done')
  const completedTasks = (project.tasks ?? []).filter((task) => task.status === 'Done')
  const [toolPasteDraft, setToolPasteDraft] = useState('')
  const [overviewCardWidths, setOverviewCardWidths] = useState<Record<OverviewCardId, number>>(loadOverviewCardWidths)

  useEffect(() => {
    window.localStorage.setItem(overviewCardWidthStorageKey, JSON.stringify(overviewCardWidths))
  }, [overviewCardWidths])

  const startCardResize = useCallback((cardId: OverviewCardId, event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()

    const startX = event.clientX
    const startWidth = overviewCardWidths[cardId]

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      setOverviewCardWidths((currentWidths) => ({
        ...currentWidths,
        [cardId]: clampOverviewCardWidth(cardId, startWidth + pointerEvent.clientX - startX),
      }))
    }

    const stopResize = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopResize)
      document.body.classList.remove('is-resizing-card')
    }

    document.body.classList.add('is-resizing-card')
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopResize, { once: true })
  }, [overviewCardWidths])

  const cardStyle = useCallback((cardId: OverviewCardId) => ({
    '--overview-card-width': `${overviewCardWidths[cardId]}px`,
  }) as CSSProperties, [overviewCardWidths])

  const cardResizeHandle = useCallback((cardId: OverviewCardId) => (
    <span
      aria-label="Resize card"
      className="card-width-resizer"
      onPointerDown={(event) => startCardResize(cardId, event)}
      role="separator"
    />
  ), [startCardResize])

  return (
    <main className="overview-dashboard">
      <section className="metric-grid">
        <article className="metric-card stage-card resizable-card" style={cardStyle('stage')}>
          <div className="card-label">{t.currentStage}</div>
          <div className="stage-title">
            <h2>{stageLabels[language][currentStage]}</h2>
            <span>{stageStatusLabels[language][projectStageStatuses[currentStage]]}</span>
          </div>
          <p>{t.stageHint}</p>
          <div className="progress-line">
            <span style={{ width: `${progress}%` }} />
          </div>
          <strong>{progress}%</strong>
          {cardResizeHandle('stage')}
        </article>

        <article className="metric-card progress-card resizable-card" style={cardStyle('progress')}>
          <div className="card-label">{t.projectProgress}</div>
          <div className="donut" aria-label="Project progress" style={{ '--progress': `${progress}%` } as CSSProperties}>
            <span>{progress}%</span>
          </div>
          <div className="progress-list">
            {projectStages.map((stage) => (
              <div className={stage === currentStage ? 'active' : ''} key={stage}>
                <span />
                <p>{stageLabels[language][stage]}</p>
                <strong>{stageStatusLabels[language][projectStageStatuses[stage]]}</strong>
              </div>
            ))}
          </div>
          {cardResizeHandle('progress')}
        </article>

        <article className="metric-card problem-card resizable-card" style={cardStyle('question')}>
          <div className="card-label danger">
            <CircleDot size={14} />
            {t.biggestQuestion}
          </div>
          <textarea
            aria-label="Biggest question"
            onChange={(event) => onUpdateQuestion({
              ...question,
              biggest_question: event.target.value,
              updated_at: new Date().toISOString(),
            })}
            placeholder={t.maxQuestionPlaceholder}
            value={question.biggest_question}
          />
          <div className="problem-controls">
            <select
              aria-label="Question priority"
              onChange={(event) => onUpdateQuestion({
                ...question,
                priority: event.target.value as ProjectQuestion['priority'],
                updated_at: new Date().toISOString(),
              })}
              value={question.priority}
            >
              {taskPriorities.map((priority) => <option key={priority} value={priority}>{localizeOption(priority, language)}</option>)}
            </select>
            <span>{question.updated_at.slice(0, 10)}</span>
          </div>
          {cardResizeHandle('question')}
        </article>

        <article className="metric-card goals-card resizable-card" style={cardStyle('goals')}>
          <div className="card-label target">
            <Target size={14} />
            {t.todayGoals}
          </div>
          {activeTasks.slice(0, 4).map((task) => (
            <div className="goal-row" key={task.id}>
              <CheckCircle2 size={15} />
              <span>{task.title}</span>
            </div>
          ))}
          {!activeTasks.length ? <p className="empty-copy">{t.emptyTodayGoals}</p> : null}
          {cardResizeHandle('goals')}
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-panel timeline-panel resizable-card" style={cardStyle('timeline')}>
          <div className="panel-title">
            <h2>{t.projectEvolutionTree}</h2>
          </div>
          <div className="timeline-list">
            {projectStages.map((stage, index) => (
              <div className={stage === currentStage ? 'timeline-item active' : 'timeline-item'} key={stage}>
                <span className="timeline-dot" />
                <button className="stage-select-button" onClick={() => onSetStage(stage)} type="button">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <strong>{stageLabels[language][stage]}</strong>
                </button>
                <select
                  aria-label={`${stageLabels[language][stage]} status`}
                  onChange={(event) => onSetStageStatus(stage, event.target.value as ProjectStageStatus)}
                  value={projectStageStatuses[stage]}
                >
                  {stageStatuses.map((status) => (
                    <option key={status} value={status}>{stageStatusLabels[language][status]}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          {cardResizeHandle('timeline')}
        </article>

        <article className="dashboard-panel task-panel resizable-card" style={cardStyle('tasks')}>
          <div className="panel-title">
            <h2>{t.todayTasks}</h2>
            <button onClick={onAddTask} type="button">
              <Plus size={14} />
              {t.add}
            </button>
          </div>
          <div className="task-list">
            {activeTasks.map((task) => (
              <div className="task-row editable" key={task.id}>
                <input
                  aria-label={`${task.title} done`}
                  checked={task.status === 'Done'}
                  onChange={(event) => onUpdateTask(task.id, { status: event.target.checked ? 'Done' : 'Todo' })}
                  type="checkbox"
                />
                <input
                  aria-label="Task title"
                  onChange={(event) => onUpdateTask(task.id, { title: event.target.value })}
                  value={task.title}
                />
                <select onChange={(event) => onUpdateTask(task.id, { type: event.target.value as ProjectTask['type'] })} value={task.type}>
                  {taskTypes.map((type) => <option key={type} value={type}>{localizeOption(type, language)}</option>)}
                </select>
                <select onChange={(event) => onUpdateTask(task.id, { priority: event.target.value as ProjectTask['priority'] })} value={task.priority}>
                  {taskPriorities.map((priority) => <option key={priority} value={priority}>{localizeOption(priority, language)}</option>)}
                </select>
                <select onChange={(event) => onUpdateTask(task.id, { status: event.target.value as ProjectTask['status'] })} value={task.status}>
                  {taskStatuses.map((status) => <option key={status} value={status}>{localizeOption(status, language)}</option>)}
                </select>
                <input onChange={(event) => onUpdateTask(task.id, { due_date: event.target.value })} type="date" value={task.due_date} />
                <button aria-label={`Delete ${task.title}`} onClick={() => onDeleteTask(task.id)} type="button">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {!activeTasks.length ? <p className="empty-copy">{t.emptyTasks}</p> : null}
          </div>
          {cardResizeHandle('tasks')}
        </article>

        <article className="dashboard-panel completed-task-panel resizable-card" style={cardStyle('completedTasks')}>
          <div className="panel-title">
            <h2>{t.completedTasks}</h2>
          </div>
          <div className="task-list">
            {completedTasks.map((task) => (
              <div className="completed-task-row" key={task.id}>
                <span className="completed-check">
                  <CheckCircle2 size={15} />
                </span>
                <div>
                  <strong>{task.title}</strong>
                  <small>
                    {localizeOption(task.type, language)}
                    {' · '}
                    {localizeOption(task.priority, language)}
                    {' · '}
                    {task.due_date}
                  </small>
                </div>
                <button className="rework-button" onClick={() => onUpdateTask(task.id, { status: 'Todo' })} type="button">
                  <RotateCcw size={13} />
                  {t.rework}
                </button>
                <button aria-label={`Delete ${task.title}`} className="delete-task-button" onClick={() => onDeleteTask(task.id)} type="button">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {!completedTasks.length ? <p className="empty-copy">{t.emptyCompletedTasks}</p> : null}
          </div>
          {cardResizeHandle('completedTasks')}
        </article>

        <article className="dashboard-panel recent-panel resizable-card" style={cardStyle('recent')}>
          <div className="panel-title">
            <h2>{t.recentBoards}</h2>
            <button type="button" onClick={onCreateBoard}>
              <Plus size={14} />
              {t.newCanvas}
            </button>
          </div>
          <div className="recent-board-list">
            {recentBoards.map((board, index) => (
              <button key={board.id} onClick={() => onOpenBoard(board.id)} type="button">
                <BoardPreview index={index} />
                <span>
                  <strong>{board.name}</strong>
                  <small>{board.updatedAt?.slice(0, 10) ?? t.noUpdates}</small>
                </span>
              </button>
            ))}
          </div>
          {cardResizeHandle('recent')}
        </article>

        <article className="dashboard-panel stats-panel resizable-card" style={cardStyle('stats')}>
          <div className="panel-title">
            <h2>{t.todayAddedNodes}</h2>
          </div>
          {[
            ['screenshots', nodeStats.screenshots],
            ['links', nodeStats.links],
            ['notes', nodeStats.notes],
            ['canvasElements', nodeStats.canvasElements],
            ['aiAnalysis', nodeStats.aiAnalysis],
          ].map(([label, value]) => (
            <div className="stat-row" key={label}>
              <span>{nodeStatLabels[language][label as keyof typeof nodeStatLabels.en]}</span>
              <strong>{value}</strong>
            </div>
          ))}
          {cardResizeHandle('stats')}
        </article>

        <article className="dashboard-panel tools-panel resizable-card" style={cardStyle('tools')}>
          <div className="panel-title">
            <h2>{t.toolbox}</h2>
            <button onClick={onAddTool} type="button">
              <Plus size={14} />
              {t.tool}
            </button>
          </div>
          <label className="tool-paste-box">
            <span>{t.pasteToolsHint}</span>
            <textarea
              onChange={(event) => setToolPasteDraft(event.target.value)}
              onPaste={(event) => {
                const pastedText = event.clipboardData.getData('text')
                const addedCount = onImportTools(pastedText)
                if (addedCount > 0) {
                  event.preventDefault()
                  setToolPasteDraft('')
                }
              }}
              placeholder={t.pasteToolsPlaceholder}
              value={toolPasteDraft}
            />
          </label>
          <div className="tool-list">
            {(project.tools ?? []).map((tool) => (
              <div className="tool-row" key={tool.id}>
                <div className="tool-name-cell">
                  <span className="tool-favicon">
                    {tool.icon_url ? (
                      <img alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} src={tool.icon_url} />
                    ) : (
                      <Globe2 size={14} />
                    )}
                  </span>
                  <input aria-label="Tool name" onChange={(event) => onUpdateTool(tool.id, { name: normalizeLocalizedOption(event.target.value) })} value={localizeOption(tool.name, language)} />
                </div>
                <input aria-label="Tool category" onChange={(event) => onUpdateTool(tool.id, { category: normalizeLocalizedOption(event.target.value) })} value={localizeOption(tool.category, language)} />
                <input
                  aria-label="Tool url"
                  onChange={(event) => {
                    const nextUrl = event.target.value
                    const normalizedUrl = normalizeUrl(nextUrl)
                    onUpdateTool(tool.id, {
                      url: nextUrl,
                      icon_url: normalizedUrl ? getToolIconUrl(normalizedUrl) : '',
                    })
                  }}
                  value={tool.url}
                />
                <input aria-label="Tool purpose" onChange={(event) => onUpdateTool(tool.id, { purpose: event.target.value })} value={tool.purpose} />
                <select onChange={(event) => onUpdateTool(tool.id, { status: event.target.value as ProjectTool['status'] })} value={tool.status}>
                  {toolStatuses.map((status) => <option key={status} value={status}>{localizeOption(status, language)}</option>)}
                </select>
                <button aria-label={`Delete ${tool.name}`} onClick={() => onDeleteTool(tool.id)} type="button">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {!(project.tools ?? []).length ? <p className="empty-copy">{language === 'en' ? 'No tools yet.' : '暂无工具。'}</p> : null}
          </div>
          {cardResizeHandle('tools')}
        </article>

        <article className="dashboard-panel ai-panel resizable-card" style={cardStyle('insights')}>
          <div className="panel-title">
            <h2>
              <Sparkles size={16} />
              {t.aiSuggestions}
            </h2>
            <Clock3 size={15} />
          </div>
          {insights.map((item) => (
            <div className="advice-row" key={item}>
              <p>{item}</p>
            </div>
          ))}
          {cardResizeHandle('insights')}
        </article>
      </section>

      <section className="quick-actions">
        <button
          className="resume-card"
          onClick={() => resumeBoard ? onOpenBoard(resumeBoard.id) : onCreateBoard()}
          type="button"
        >
          <Play size={16} />
          <strong>{resumeBoard ? t.resume : t.newCanvas}</strong>
          <span>{resumeBoard?.name ?? (language === 'en' ? 'Create the first canvas for this project' : '为这个项目创建第一个画布')}</span>
          <em>
            {resumeBoard ? t.resumeOpenBoard : t.newCanvas}
            <ArrowRight size={15} />
          </em>
        </button>
      </section>
    </main>
  )
}

function AIPartnerPanel({
  aiBusy,
  aiMessages,
  assets,
  collaboratorNotes,
  comments,
  currentBoardId,
  externalLibraries,
  externalLibrariesLoading,
  externalLibraryBusyId,
  libraryItems,
  latestAiResult,
  language,
  isReadOnly,
  onAddCollaboratorNote,
  onAddComment,
  onDeleteCollaboratorNote,
  onDeleteComment,
  onDeleteLibraryItems,
  onHidePanel,
  onImportExternalLibrary,
  onInsertAiResult,
  onOpenExcalidrawLibrary,
  onRunAi,
  onSelectAsset,
  selectedAssetId,
  selectedContext,
}: {
  aiBusy: boolean
  aiMessages: AiMessage[]
  assets: ResearchAsset[]
  collaboratorNotes: CollaboratorNote[]
  comments: CanvasComment[]
  currentBoardId: string
  externalLibraries: ExternalLibrary[]
  externalLibrariesLoading: boolean
  externalLibraryBusyId?: string
  libraryItems: LibraryItems
  latestAiResult: string
  language: Language
  isReadOnly: boolean
  onAddCollaboratorNote: (collaborator: string, feedback: string) => void
  onAddComment: (body: string, elementId?: string) => void
  onDeleteCollaboratorNote: (noteId: string) => void
  onDeleteComment: (commentId: string) => void
  onDeleteLibraryItems: (itemIds: string[]) => void
  onHidePanel: () => void
  onImportExternalLibrary: (library: ExternalLibrary) => void
  onInsertAiResult: () => void
  onOpenExcalidrawLibrary: () => void
  onRunAi: (action: AiAction, question?: string) => void
  onSelectAsset: (assetId: string) => void
  selectedAssetId: string
  selectedContext: ReturnType<typeof summarizeSelectedElements>
}) {
  const t = copy[language]
  const [activeTab, setActiveTab] = useState<PartnerTab>('analysis')
  const [question, setQuestion] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [collaboratorDraft, setCollaboratorDraft] = useState('')
  const [feedbackDraft, setFeedbackDraft] = useState('')
  const [libraryQuery, setLibraryQuery] = useState('')
  const [selectedLibraryItemIds, setSelectedLibraryItemIds] = useState<string[]>([])
  const actionButtons: Array<[AiAction, string]> = [
    ['analyze', t.analyzeSelected],
    ['compare', t.compareSelected],
    ['summarize', t.summarizeCanvas],
    ['pattern', t.findPattern],
    ['conflict', t.findConflict],
    ['tasks', t.generateTasks],
    ['codexPrompt', t.exportPromptForCodex],
  ]
  const selectedCount = selectedContext.length
  const selectedElementId = selectedContext[0]?.id
  const normalizedLibraryQuery = libraryQuery.trim().toLowerCase()
  const visibleExternalLibraries = externalLibraries
    .filter((library) => {
      if (!normalizedLibraryQuery) return true
      return [
        library.name,
        library.description,
        library.itemNames.join(' '),
      ].some((value) => value.toLowerCase().includes(normalizedLibraryQuery))
    })
  const selectedLibraryItems = libraryItems.filter((item) => selectedLibraryItemIds.includes(item.id))
  const visibleComments = comments
    .filter((comment) => comment.boardId === currentBoardId)
    .filter((comment) => selectedElementId ? comment.elementId === selectedElementId : !comment.elementId)
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  useEffect(() => {
    setSelectedLibraryItemIds((currentIds) => currentIds.filter((id) => libraryItems.some((item) => item.id === id)))
  }, [libraryItems])

  const toggleLibraryItem = (itemId: string) => {
    setSelectedLibraryItemIds((currentIds) => (
      currentIds.includes(itemId)
        ? currentIds.filter((id) => id !== itemId)
        : [...currentIds, itemId]
    ))
  }

  const deleteSelectedLibraryItems = () => {
    if (!selectedLibraryItemIds.length || isReadOnly) return
    const selectedNames = selectedLibraryItems.map((item, index) =>
      item.name || (language === 'en' ? `Library item ${index + 1}` : `素材 ${index + 1}`)
    )
    const confirmed = window.confirm(
      language === 'en'
        ? `Delete ${selectedNames.length} selected library item(s)?\n\n${selectedNames.join('\n')}`
        : `确认删除 ${selectedNames.length} 个已选素材？\n\n${selectedNames.join('\n')}`,
    )
    if (!confirmed) return
    onDeleteLibraryItems(selectedLibraryItemIds)
    setSelectedLibraryItemIds([])
  }
  const visibleCollaboratorNotes = collaboratorNotes
    .filter((note) => note.boardId === currentBoardId)
    .slice()
    .sort((a, b) => b.created_at.localeCompare(a.created_at))

  const submitQuestion = () => {
    const nextQuestion = question.trim()
    if (!nextQuestion) return
    onRunAi('analyze', nextQuestion)
    setQuestion('')
  }

  const submitComment = () => {
    const body = commentDraft.trim()
    if (!body) return
    onAddComment(body, selectedElementId)
    setCommentDraft('')
  }

  const submitCollaboratorNote = () => {
    const feedback = feedbackDraft.trim()
    if (!feedback) return
    onAddCollaboratorNote(collaboratorDraft.trim() || t.collaborator, feedback)
    setCollaboratorDraft('')
    setFeedbackDraft('')
  }

  return (
    <aside className="analysis-panel">
      <div className="library-head">
        <button type="button">
          <Bot size={16} />
          Partner
        </button>
        <button aria-label={t.hideLibraryPanel} className="panel-toggle-button" onClick={onHidePanel} type="button">
          <PanelRight size={16} />
        </button>
      </div>

      <div className="partner-tabs">
        {([
          ['analysis', t.aiAnalysis],
          ['assets', t.assetsTab],
          ['libraries', t.librariesTab],
        ] as Array<[PartnerTab, string]>).map(([tab, label]) => (
          <button
            className={activeTab === tab ? 'active' : ''}
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'analysis' ? (
      <>
        <div className="selected-context-card">
        <div>
          <span>{t.selectedContext}</span>
          <strong>{selectedCount ? `${selectedCount} selected` : language === 'en' ? 'No canvas selection' : '未选择画布元素'}</strong>
        </div>
        {selectedCount ? (
          <div className="selected-context-list">
            {selectedContext.map((item) => (
              <article key={item.id}>
                <small>{item.type}</small>
                <strong>{item.label}</strong>
                {item.assetSource ? <p>{item.assetSource}</p> : null}
                {item.link ? <p>{item.link}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <p>{language === 'en' ? 'Select one or more Canvas elements, screenshots, or URL embeds to give the AI context.' : '在 Canvas 中选择一个或多个元素、截图或 URL，AI 会读取这些上下文。'}</p>
        )}
      </div>

      <div className="ai-action-grid">
        {actionButtons.map(([action, label]) => (
          <button disabled={aiBusy} key={action} onClick={() => onRunAi(action)} type="button">
            {label}
          </button>
        ))}
      </div>

      <div className="ai-chat-box">
        <div className="ai-message-list">
          {aiMessages.map((message) => (
            <div className={`ai-message ${message.role}`} key={message.id}>
              <span>{message.role === 'user' ? 'You' : t.aiPartner}</span>
              <p>{message.content}</p>
            </div>
          ))}
          {!aiMessages.length ? (
            <p className="empty-copy">{language === 'en' ? 'Ask a question or run an analysis action.' : '输入问题，或点击上方分析动作。'}</p>
          ) : null}
        </div>
        <label>
          <textarea
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                submitQuestion()
              }
            }}
            placeholder={t.askAiPlaceholder}
            value={question}
          />
        </label>
        <button disabled={aiBusy || !question.trim()} onClick={submitQuestion} type="button">
          <Sparkles size={15} />
          {aiBusy ? (language === 'en' ? 'Thinking...' : '分析中...') : t.analyze}
        </button>
      </div>

      <button className="insert-analysis-button" disabled={!latestAiResult} onClick={onInsertAiResult} type="button">
        <Plus size={15} />
        {t.insertAnalysisNode}
      </button>

      <section className="notes-card">
        <div className="notes-card-head">
          <strong>{t.comments}</strong>
          <span>{selectedElementId ? selectedContext[0]?.label : language === 'en' ? 'Board' : '画布'}</span>
        </div>
        <div className="note-list">
          {visibleComments.map((comment) => (
            <article key={comment.id}>
              <div>
                <strong>{comment.author}</strong>
                <small>{comment.created_at.slice(0, 16).replace('T', ' ')}</small>
              </div>
              <p>{comment.body}</p>
              {!isReadOnly ? (
                <button aria-label={t.delete} onClick={() => onDeleteComment(comment.id)} type="button">
                  <Trash2 size={13} />
                </button>
              ) : null}
            </article>
          ))}
          {!visibleComments.length ? <p className="empty-copy">{t.emptyComments}</p> : null}
        </div>
        {!isReadOnly ? (
          <div className="note-compose">
            <textarea
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder={t.commentPlaceholder}
              value={commentDraft}
            />
            <button disabled={!commentDraft.trim()} onClick={submitComment} type="button">
              <Plus size={14} />
              {t.add}
            </button>
          </div>
        ) : null}
      </section>

      <section className="notes-card">
        <div className="notes-card-head">
          <strong>{t.collaboratorNotes}</strong>
          <span>{visibleCollaboratorNotes.length}</span>
        </div>
        <div className="note-list">
          {visibleCollaboratorNotes.map((note) => (
            <article key={note.id}>
              <div>
                <strong>{note.collaborator}</strong>
                <small>{note.created_at.slice(0, 16).replace('T', ' ')}</small>
              </div>
              <p>{note.feedback}</p>
              {!isReadOnly ? (
                <button aria-label={t.delete} onClick={() => onDeleteCollaboratorNote(note.id)} type="button">
                  <Trash2 size={13} />
                </button>
              ) : null}
            </article>
          ))}
          {!visibleCollaboratorNotes.length ? <p className="empty-copy">{t.emptyCollaboratorNotes}</p> : null}
        </div>
        {!isReadOnly ? (
          <div className="note-compose">
            <input
              aria-label={t.collaborator}
              onChange={(event) => setCollaboratorDraft(event.target.value)}
              placeholder={t.collaborator}
              value={collaboratorDraft}
            />
            <textarea
              onChange={(event) => setFeedbackDraft(event.target.value)}
              placeholder={t.feedbackPlaceholder}
              value={feedbackDraft}
            />
            <button disabled={!feedbackDraft.trim()} onClick={submitCollaboratorNote} type="button">
              <Plus size={14} />
          {t.add}
        </button>
      </div>
        ) : null}
      </section>
      </>
      ) : null}

      {activeTab === 'assets' ? (
        <section className="partner-card">
          <div className="external-library-head">
            <div>
              <strong>{language === 'en' ? 'Assets' : '资产'}</strong>
              <p>{t.emptyAssetsHint}</p>
            </div>
            <span>{assets.length}</span>
          </div>
          <div className="asset-list partner-asset-list">
            {assets.map((asset) => (
              <button
                className={asset.id === selectedAssetId ? 'active' : ''}
                key={asset.id}
                onClick={() => onSelectAsset(asset.id)}
                type="button"
              >
                <img alt="" src={asset.image} />
                <span>
                  <strong>{asset.title}</strong>
                  <small>{asset.kind}</small>
                </span>
              </button>
            ))}
            {!assets.length ? <p className="empty-copy">{t.emptyAssets}</p> : null}
          </div>
        </section>
      ) : null}

      {activeTab === 'libraries' ? (
        <>
          <section className="my-library-card">
            <div>
              <BookOpen size={18} />
              <strong>{t.myLibrary}</strong>
              <span>{libraryItems.length} {t.libraryItems}</span>
            </div>
            <button onClick={onOpenExcalidrawLibrary} type="button">
              <BookOpen size={15} />
              {t.openExcalidrawLibrary}
            </button>
            <div className="my-library-toolbar">
              <button disabled={!libraryItems.length} onClick={() => setSelectedLibraryItemIds(libraryItems.map((item) => item.id))} type="button">
                {t.selectAll}
              </button>
              <button disabled={!selectedLibraryItemIds.length} onClick={() => setSelectedLibraryItemIds([])} type="button">
                {language === 'en' ? 'Clear' : '清除'}
              </button>
              <button className="danger" disabled={isReadOnly || !selectedLibraryItemIds.length} onClick={deleteSelectedLibraryItems} type="button">
                <Trash2 size={13} />
                {t.deleteSelected}{selectedLibraryItemIds.length ? ` (${selectedLibraryItemIds.length})` : ''}
              </button>
            </div>
            {selectedLibraryItems.length ? (
              <div className="library-selection-banner">
                <strong>{language === 'en' ? `${selectedLibraryItems.length} selected` : `已选择 ${selectedLibraryItems.length} 个`}</strong>
                <span>
                  {selectedLibraryItems
                    .slice(0, 3)
                    .map((item, index) => item.name || (language === 'en' ? `Library item ${index + 1}` : `素材 ${index + 1}`))
                    .join('、')}
                  {selectedLibraryItems.length > 3 ? (language === 'en' ? '...' : ' 等') : ''}
                </span>
              </div>
            ) : null}
            <div className="my-library-list">
              {libraryItems.map((item, index) => (
                <label className={`my-library-item ${selectedLibraryItemIds.includes(item.id) ? 'selected' : ''}`} key={item.id}>
                  <input checked={selectedLibraryItemIds.includes(item.id)} disabled={isReadOnly} onChange={() => toggleLibraryItem(item.id)} type="checkbox" />
                  <span>{index + 1}</span>
                  <div>
                    <strong>{item.name || (language === 'en' ? `Library item ${index + 1}` : `素材 ${index + 1}`)}</strong>
                    <p>{item.elements.length} {language === 'en' ? 'elements' : '个元素'}{item.status ? ` · ${item.status}` : ''}</p>
                  </div>
                  {selectedLibraryItemIds.includes(item.id) ? (
                    <em>{language === 'en' ? 'Selected' : '已选'}</em>
                  ) : null}
                </label>
              ))}
              {!libraryItems.length ? <p className="empty-copy">{t.noLibraryItems}</p> : null}
            </div>
            {selectedLibraryItems.length ? <p className="library-selection-copy">{language === 'en' ? 'Selected' : '已选择'} {selectedLibraryItems.length}</p> : null}
          </section>

          <section className="external-library-card">
            <div className="external-library-head">
              <div>
                <strong>{t.externalLibraries}</strong>
                <p>{t.externalLibrariesHint}</p>
              </div>
              <span>{externalLibraries.length}</span>
            </div>
            <input aria-label={t.searchLibraries} onChange={(event) => setLibraryQuery(event.target.value)} placeholder={t.searchLibraries} value={libraryQuery} />
            {externalLibrariesLoading ? (
              <p className="empty-copy">{t.libraryLoading}</p>
            ) : (
              <div className="external-library-list partner-library-list">
                {visibleExternalLibraries.map((library) => (
                  <article key={library.id}>
                    {library.previewUrl ? <img alt="" src={library.previewUrl} /> : <div className="library-preview-placeholder" />}
                    <div>
                      <strong>{library.name}</strong>
                      <p>{library.itemNames.slice(0, 8).join(', ') || library.description}</p>
                    </div>
                    <button disabled={isReadOnly || Boolean(externalLibraryBusyId)} onClick={() => onImportExternalLibrary(library)} type="button">
                      <Plus size={13} />
                      {externalLibraryBusyId === library.id ? (language === 'en' ? 'Adding' : '加入中') : t.add}
                    </button>
                  </article>
                ))}
                {!visibleExternalLibraries.length && !externalLibrariesLoading ? <p className="empty-copy">{language === 'en' ? 'No matching libraries.' : '没有匹配的素材库。'}</p> : null}
              </div>
            )}
          </section>
        </>
      ) : null}
    </aside>
  )
}

function EmptyCanvasState({
  language,
  onCreateBoard,
}: {
  language: Language
  onCreateBoard: () => void
}) {
  return (
    <main className="empty-canvas-state">
      <Grid2X2 size={28} />
      <h2>{language === 'en' ? 'No canvas yet' : '还没有画布'}</h2>
      <p>{language === 'en' ? 'Create a canvas when this project is ready to sketch.' : '等这个项目需要开始画图时，再创建第一个画布。'}</p>
      <button onClick={onCreateBoard} type="button">
        <Plus size={15} />
        {copy[language].newCanvas}
      </button>
    </main>
  )
}

function ExcalidrawCanvas({
  board,
  projectId,
  isReadOnly,
  language,
  libraryItems,
  selectedAsset,
  pendingAssetId,
  onInsertSelected,
  onLibraryChange,
  onSceneChange,
  onSelectionChange,
  onReady,
}: {
  board: Board
  projectId: string
  isReadOnly: boolean
  language: Language
  libraryItems: LibraryItems
  selectedAsset?: ResearchAsset
  pendingAssetId?: string
  onInsertSelected: () => void
  onLibraryChange: (libraryItems: LibraryItems) => void
  onSceneChange: (scene: CanvasScene) => void
  onSelectionChange: (selectedElementIds: string[]) => void
  onReady: (api: ExcalidrawImperativeAPI | null) => void
}) {
  const t = copy[language]
  const initialCanvas = board.canvas
  const libraryReturnUrl = buildLibraryReturnUrl(projectId, board.id)
  const savedLibrarySignature = getLibraryItemsSignature(libraryItems)
  const lastLibrarySignatureRef = useRef(savedLibrarySignature)

  useEffect(() => {
    lastLibrarySignatureRef.current = savedLibrarySignature
  }, [savedLibrarySignature])

  const handleLibraryChange = useCallback((nextLibraryItems: LibraryItems) => {
    const nextSignature = getLibraryItemsSignature(nextLibraryItems)
    if (nextSignature === lastLibrarySignatureRef.current) return
    lastLibrarySignatureRef.current = nextSignature
    onLibraryChange(nextLibraryItems)
  }, [onLibraryChange])

  return (
    <main className="excalidraw-shell">
      <div className="excalidraw-topline">
        <div className="canvas-status">
          <Bot size={14} />
          {t.canvasStatus}
          <span className="board-chip">{board.name}</span>
        </div>
        <div className="canvas-topline-actions">
          <button disabled={isReadOnly || !selectedAsset} onClick={onInsertSelected} type="button">
            <ImagePlus size={15} />
            {t.addSelectedScreenshot}
          </button>
        </div>
      </div>

      <section className="excalidraw-frame" data-pending-asset={pendingAssetId ?? ''}>
          <Excalidraw
          excalidrawAPI={(nextApi) => {
            onReady(nextApi)
          }}
          validateEmbeddable={() => true}
          viewModeEnabled={isReadOnly}
          libraryReturnUrl={libraryReturnUrl}
          initialData={{
            elements: initialCanvas.elements,
            files: initialCanvas.files,
            libraryItems,
            appState: {
              viewBackgroundColor: '#ffffff',
            },
          }}
          onLibraryChange={handleLibraryChange}
          onChange={(elements, appState, files) => {
            onSelectionChange(Object.keys(appState.selectedElementIds ?? {}))
            if (isReadOnly) return
            onSceneChange({
              elements,
              files,
            })
          }}
        />
      </section>
    </main>
  )
}

function App() {
  const [state, saveState, cloudSync, saveCloudNow] = useWorkspaceState()
  const [activeProjectId, setActiveProjectId] = useState(() => {
    const requestedProjectId = new URLSearchParams(window.location.search).get('project')
    return state.projects.some((project) => project.id === requestedProjectId)
      ? requestedProjectId ?? ''
      : state.projects[0]?.id ?? ''
  })
  const [selectedAssetId, setSelectedAssetId] = useState(state.projects[0]?.assets[0]?.id ?? '')
  const [mode, setMode] = useState<'overview' | 'canvas'>(() => (
    new URLSearchParams(window.location.search).get('readonly') === '1' ||
    new URLSearchParams(window.location.search).get('mode') === 'canvas' ||
    hasIncomingLibraryImport()
      ? 'canvas'
      : 'overview'
  ))
  const [pendingAssetId, setPendingAssetId] = useState<string>()
  const [boardMenu, setBoardMenu] = useState<BoardContextMenu>()
  const [isProjectPanelOpen, setIsProjectPanelOpen] = useState(true)
  const [isLibraryPanelOpen, setIsLibraryPanelOpen] = useState(true)
  const [projectPanelWidth, setProjectPanelWidth] = useState(250)
  const [libraryPanelWidth, setLibraryPanelWidth] = useState(336)
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([])
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([])
  const [aiBusy, setAiBusy] = useState(false)
  const [latestAiResult, setLatestAiResult] = useState('')
  const [externalLibraries, setExternalLibraries] = useState<ExternalLibrary[]>([])
  const [externalLibraryBusyId, setExternalLibraryBusyId] = useState<string>()
  const [externalLibrariesLoading, setExternalLibrariesLoading] = useState(false)
  const [language, setLanguage] = useState<Language>('en')
  const [isReadOnly] = useState(() => new URLSearchParams(window.location.search).get('readonly') === '1')
  const [toast, setToast] = useState<ToastMessage>()
  const excalidrawApiRef = useRef<ExcalidrawImperativeAPI | null>(null)
  const canvasSignatureRef = useRef('')

  const activeProject = state.projects.find((project) => project.id === activeProjectId) ?? state.projects[0]
  const requestedBoardId = new URLSearchParams(window.location.search).get('board')
  const activeBoardId = requestedBoardId && activeProject?.boards.some((board) => board.id === requestedBoardId && !board.deletedAt)
    ? requestedBoardId
    : activeProject?.activeBoardId ?? firstActiveBoardOf(activeProject)?.id ?? ''
  const activeBoard = activeBoardsOf(activeProject).find((board) => board.id === activeBoardId) ?? firstActiveBoardOf(activeProject)
  const selectedAsset = activeProject?.assets.find((asset) => asset.id === selectedAssetId)
  const activeBoardCanvasSignature = getSceneSignature(activeBoard?.canvas ?? emptyCanvas())
  const selectedCanvasElements = (activeBoard?.canvas.elements ?? [])
    .filter((element) => !element.isDeleted && selectedElementIds.includes(element.id))
  const selectedContext = summarizeSelectedElements(selectedCanvasElements, activeProject?.assets ?? [])

  useEffect(() => {
    if (!window.name) {
      window.name = workspaceWindowName
    }
  }, [])

  useEffect(() => {
    if (mode !== 'canvas' || externalLibraries.length) return undefined

    let isCancelled = false
    setExternalLibrariesLoading(true)
    fetch(`${publicLibrariesBaseUrl}/libraries.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        return response.json() as Promise<Parameters<typeof normalizeExternalLibraries>[0]>
      })
      .then((items) => {
        if (!isCancelled) {
          setExternalLibraries(normalizeExternalLibraries(items))
        }
      })
      .catch((error) => {
        console.warn('Could not load public Excalidraw libraries.', error)
      })
      .finally(() => {
        if (!isCancelled) {
          setExternalLibrariesLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [externalLibraries.length, mode])

  const startPanelResize = (target: PanelResizeTarget, event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()
    document.body.classList.add('is-resizing-panel')

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (target === 'project') {
        setProjectPanelWidth(clamp(moveEvent.clientX, 210, 430))
        return
      }

      setLibraryPanelWidth(clamp(window.innerWidth - moveEvent.clientX, 280, 560))
    }

    const stopPanelResize = () => {
      document.body.classList.remove('is-resizing-panel')
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', stopPanelResize)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', stopPanelResize)
  }

  useEffect(() => {
    canvasSignatureRef.current = activeBoardCanvasSignature
  }, [activeProject?.id, activeBoard?.id, activeBoardCanvasSignature])

  useEffect(() => {
    setSelectedElementIds([])
  }, [activeProject?.id, activeBoard?.id])

  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(undefined), 2200)
    return () => window.clearTimeout(timeout)
  }, [toast])

  useEffect(() => {
    if (!boardMenu) return undefined

    const closeMenu = () => setBoardMenu(undefined)
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu()
      }
    }

    window.addEventListener('click', closeMenu)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('click', closeMenu)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [boardMenu])

  const updateProjects = (projects: Project[]) => saveState({ ...state, projects })

  const updateActiveProject = (updater: (project: Project) => Project) => {
    updateProjects(state.projects.map((project) => (project.id === activeProject.id ? updater(project) : project)))
  }

  const openBoardMenu = (event: MouseEvent, projectId: string, boardId: string) => {
    event.preventDefault()
    setBoardMenu({
      boardId,
      projectId,
      x: event.clientX,
      y: event.clientY,
    })
  }

  const openProjectBoard = (projectId: string, boardId: string) => {
    const project = state.projects.find((item) => item.id === projectId)
    if (!project) return
    const board = activeBoardsOf(project).find((item) => item.id === boardId)
    if (!board) return

    setActiveProjectId(projectId)
    setSelectedAssetId(project.assets[0]?.id ?? '')
    excalidrawApiRef.current = null
    canvasSignatureRef.current = getSceneSignature(board.canvas)
    updateProjects(state.projects.map((item) => (
      item.id === projectId
        ? {
            ...item,
            activeBoardId: boardId,
          }
        : item
    )))
    syncCanvasRoute(projectId, boardId)
    setMode('canvas')
  }

  const openBoard = (boardId: string) => {
    openProjectBoard(activeProject.id, boardId)
  }

  const createProject = () => {
    const projectNumber = state.projects.length + 1
    const projectId = makeId('project')
    const project: Project = {
      id: projectId,
      name: `New Project ${projectNumber}`,
      type: 'Research project',
      assets: [],
      boards: [],
      currentStage: 'Idea',
      stageStatuses: createStageStatuses('Idea'),
      stageUpdatedAt: new Date().toISOString(),
      biggestQuestion: createDefaultQuestion(),
      tasks: [],
      canvasNodes: [],
      tools: [],
      insights: [],
      comments: [],
      collaboratorNotes: [],
    }

    updateProjects([...state.projects, project])
    setActiveProjectId(project.id)
    setSelectedAssetId('')
    canvasSignatureRef.current = getSceneSignature(emptyCanvas())
    excalidrawApiRef.current = null
    setMode('overview')
  }

  const renameProject = (projectId: string, name: string) => {
    updateProjects(state.projects.map((project) => (
      project.id === projectId
        ? {
            ...project,
            name,
          }
        : project
    )))
  }

  const moveProject = (projectId: string, direction: -1 | 1) => {
    const currentIndex = state.projects.findIndex((project) => project.id === projectId)
    const nextIndex = currentIndex + direction
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= state.projects.length) return

    const nextProjects = [...state.projects]
    const [project] = nextProjects.splice(currentIndex, 1)
    nextProjects.splice(nextIndex, 0, project)
    updateProjects(nextProjects)
  }

  const deleteProject = (projectId: string) => {
    if (state.projects.length <= 1) return

    const remainingProjects = state.projects.filter((project) => project.id !== projectId)
    const nextActiveProject = activeProject.id === projectId
      ? remainingProjects[0]
      : activeProject

    updateProjects(remainingProjects)

    if (activeProject.id === projectId) {
      setActiveProjectId(nextActiveProject.id)
      setSelectedAssetId(nextActiveProject.assets[0]?.id ?? '')
      canvasSignatureRef.current = getSceneSignature(firstActiveBoardOf(nextActiveProject)?.canvas ?? emptyCanvas())
      excalidrawApiRef.current = null
      setMode('overview')
    }
  }

  const createBoard = (projectId = activeProject.id) => {
    const project = state.projects.find((item) => item.id === projectId)
    if (!project) return

    const now = new Date().toISOString()
    const boardNumber = activeBoardsOf(project).length + 1
    const board: Board = {
      id: makeId(`${project.id}-board`),
      name: `Canvas ${boardNumber}`,
      canvas: emptyCanvas(),
      updatedAt: now,
    }

    updateProjects(state.projects.map((item) => (
      item.id === project.id
        ? {
            ...item,
            boards: [...item.boards, board],
            activeBoardId: board.id,
          }
        : item
    )))
    setActiveProjectId(project.id)
    setSelectedAssetId(project.assets[0]?.id ?? '')
    canvasSignatureRef.current = getSceneSignature(board.canvas)
    excalidrawApiRef.current = null
    syncCanvasRoute(project.id, board.id)
    setMode('canvas')
  }

  const renameBoard = (projectId: string, boardId: string, name: string) => {
    updateProjects(state.projects.map((project) => (
      project.id === projectId
        ? {
            ...project,
            boards: project.boards.map((board) => (
              board.id === boardId ? { ...board, name, updatedAt: new Date().toISOString() } : board
            )),
          }
        : project
    )))
  }

  const deleteBoard = (projectId: string, boardId: string) => {
    const project = state.projects.find((item) => item.id === projectId)
    const board = project?.boards.find((item) => item.id === boardId)
    const activeBoards = project ? activeBoardsOf(project) : []
    if (!project || !board || activeBoards.length <= 1) return

    const deletedAt = new Date().toISOString()
    const remainingBoards = activeBoards.filter((item) => item.id !== boardId)
    if (!remainingBoards.length) return

    const nextActiveBoardId =
      project.activeBoardId === boardId
        ? remainingBoards[0].id
        : project.activeBoardId

    updateProjects(state.projects.map((item) => (
      item.id === projectId
        ? {
            ...item,
            boards: item.boards.map((boardItem) => (
              boardItem.id === boardId ? { ...boardItem, deletedAt, updatedAt: deletedAt } : boardItem
            )),
            activeBoardId: nextActiveBoardId,
          }
        : item
    )))

    if (activeProject.id === projectId && activeBoardId === boardId) {
      excalidrawApiRef.current = null
      canvasSignatureRef.current = getSceneSignature(remainingBoards[0].canvas)
    }

    setBoardMenu(undefined)
  }

  const restoreBoard = (projectId: string, boardId: string) => {
    updateProjects(state.projects.map((project) => (
      project.id === projectId
        ? {
            ...project,
            boards: project.boards.map((board) => (
              board.id === boardId
                ? { ...board, deletedAt: undefined, updatedAt: new Date().toISOString() }
                : board
            )),
          }
        : project
    )))
  }

  const deleteBoardForever = (projectId: string, boardId: string) => {
    updateProjects(state.projects.map((project) => (
      project.id === projectId
        ? {
            ...project,
            boards: project.boards.filter((board) => board.id !== boardId),
          }
        : project
    )))
    setBoardMenu(undefined)
  }

  const updateProjectStage = (stage: ProjectStageName) => {
    updateActiveProject((project) => ({
      ...project,
      currentStage: stage,
      stageUpdatedAt: new Date().toISOString(),
    }))
  }

  const updateProjectStageStatus = (stage: ProjectStageName, status: ProjectStageStatus) => {
    updateActiveProject((project) => {
      const currentStage = normalizeStage(project.currentStage)
      return {
        ...project,
        stageStatuses: {
          ...createStageStatuses(currentStage, project.stageStatuses),
          [stage]: status,
        },
        stageUpdatedAt: stage === currentStage ? new Date().toISOString() : project.stageUpdatedAt,
      }
    })
  }

  const updateProjectQuestion = (question: ProjectQuestion) => {
    updateActiveProject((project) => ({
      ...project,
      biggestQuestion: question,
    }))
  }

  const addTask = () => {
    const today = new Date().toISOString().slice(0, 10)
    const task: ProjectTask = {
      id: makeId('task'),
      title: 'New task',
      type: 'Research',
      priority: 'Medium',
      status: 'Todo',
      due_date: today,
    }

    updateActiveProject((project) => ({
      ...project,
      tasks: [...(project.tasks ?? []), task],
    }))
  }

  const updateTask = (taskId: string, updates: Partial<ProjectTask>) => {
    updateActiveProject((project) => ({
      ...project,
      tasks: (project.tasks ?? []).map((task) => (
        task.id === taskId ? { ...task, ...updates } : task
      )),
    }))
  }

  const deleteTask = (taskId: string) => {
    updateActiveProject((project) => ({
      ...project,
      tasks: (project.tasks ?? []).filter((task) => task.id !== taskId),
    }))
  }

  const addTool = () => {
    const tool: ProjectTool = {
      id: makeId('tool'),
      name: 'New tool',
      category: 'Research',
      url: '',
      icon_url: '',
      purpose: '',
      status: 'Saved',
    }

    updateActiveProject((project) => ({
      ...project,
      tools: [...(project.tools ?? []), tool],
    }))
  }

  const importToolsFromText = (text: string) => {
    const entries = extractToolLinks(text)
    if (!entries.length) return 0

    let addedCount = 0
    updateActiveProject((project) => {
      const existingUrls = new Set((project.tools ?? []).map((tool) => normalizeUrl(tool.url) ?? tool.url))
      const nextTools = [...(project.tools ?? [])]

      entries.forEach((entry) => {
        if (existingUrls.has(entry.url)) return
        existingUrls.add(entry.url)
        addedCount += 1
        nextTools.push({
          id: makeId('tool-link'),
          name: entry.label || getToolTitleFromUrl(entry.url),
          category: 'Research',
          url: entry.url,
          icon_url: getToolIconUrl(entry.url),
          purpose: entry.label,
          status: 'Saved',
        })
      })

      return {
        ...project,
        tools: nextTools,
      }
    })

    if (addedCount > 0) {
      showToast(`${copy[language].importedTools}: ${addedCount}`)
    }
    return addedCount
  }

  const updateTool = (toolId: string, updates: Partial<ProjectTool>) => {
    updateActiveProject((project) => ({
      ...project,
      tools: (project.tools ?? []).map((tool) => (
        tool.id === toolId ? { ...tool, ...updates } : tool
      )),
    }))
  }

  const deleteTool = (toolId: string) => {
    updateActiveProject((project) => ({
      ...project,
      tools: (project.tools ?? []).filter((tool) => tool.id !== toolId),
    }))
  }

  const showToast = (message: string) => {
    setToast({
      id: makeId('toast'),
      message,
    })
  }

  const importExternalLibrary = async (library: ExternalLibrary) => {
    if (isReadOnly || !excalidrawApiRef.current || externalLibraryBusyId) return

    setExternalLibraryBusyId(library.id)
    try {
      const response = await fetch(library.sourceUrl)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      const nextLibraryItems = await excalidrawApiRef.current.updateLibrary({
        libraryItems: blob,
        merge: true,
        prompt: false,
        defaultStatus: 'published',
        openLibraryMenu: true,
      })
      updateActiveProject((project) => ({
        ...project,
        libraryItems: nextLibraryItems,
      }))
      showToast(`${copy[language].libraryAdded}: ${library.name}`)
    } catch (error) {
      console.warn('Could not import Excalidraw library.', error)
      showToast(`${copy[language].libraryAddFailed}: ${library.name}`)
    } finally {
      setExternalLibraryBusyId(undefined)
    }
  }

  const openExcalidrawLibrary = () => {
    void excalidrawApiRef.current?.updateLibrary({
      libraryItems: activeProject.libraryItems ?? [],
      merge: true,
      prompt: false,
      openLibraryMenu: true,
    })
  }

  const deleteLibraryItems = (itemIds: string[]) => {
    if (isReadOnly || !itemIds.length) return
    const itemIdSet = new Set(itemIds)
    const nextLibraryItems = (activeProject.libraryItems ?? []).filter((item) => !itemIdSet.has(item.id))

    updateActiveProject((project) => ({
      ...project,
      libraryItems: nextLibraryItems,
    }))
    void excalidrawApiRef.current?.updateLibrary({
      libraryItems: nextLibraryItems,
      merge: false,
      prompt: false,
      openLibraryMenu: true,
    })
  }

  const shareReadOnlyLink = async () => {
    const url = new URL(window.location.href)
    url.searchParams.set('readonly', '1')
    url.searchParams.set('project', activeProject.id)
    if (activeBoard?.id) {
      url.searchParams.set('board', activeBoard.id)
    }
    url.hash = ''
    await copyText(url.toString())
    showToast(copy[language].copiedReadOnlyLink)
  }

  const exportCurrentBoardPng = async () => {
    if (!activeBoard) return
    const elements = activeBoard.canvas.elements.filter((element) => !element.isDeleted)
    const blob = await exportToBlob({
      elements,
      files: activeBoard.canvas.files,
      appState: {
        viewBackgroundColor: '#ffffff',
        exportBackground: true,
      },
      mimeType: 'image/png',
      exportPadding: 24,
    })
    downloadBlob(blob, `${slugifyFileName(`${activeProject.name}-${activeBoard.name}`)}.png`)
  }

  const exportCurrentBoardJson = () => {
    if (!activeBoard) return
    const json = serializeAsJSON(
      [...activeBoard.canvas.elements],
      {
        viewBackgroundColor: '#ffffff',
      },
      activeBoard.canvas.files,
      'local',
    )
    downloadBlob(new Blob([json], { type: 'application/json' }), `${slugifyFileName(`${activeProject.name}-${activeBoard.name}`)}.excalidraw`)
  }

  const addCanvasComment = (body: string, elementId?: string) => {
    if (!activeBoard || isReadOnly) return
    const comment: CanvasComment = {
      id: makeId('comment'),
      boardId: activeBoard.id,
      elementId,
      author: 'Qiuyi Ye',
      body,
      created_at: new Date().toISOString(),
    }

    updateActiveProject((project) => ({
      ...project,
      comments: [...(project.comments ?? []), comment],
      canvasNodes: [...(project.canvasNodes ?? []), makeCanvasNode(activeBoard.id, 'note')],
    }))
  }

  const deleteCanvasComment = (commentId: string) => {
    if (isReadOnly) return
    updateActiveProject((project) => ({
      ...project,
      comments: (project.comments ?? []).filter((comment) => comment.id !== commentId),
    }))
  }

  const addCollaboratorNote = (collaborator: string, feedback: string) => {
    if (!activeBoard || isReadOnly) return
    const note: CollaboratorNote = {
      id: makeId('collaborator-note'),
      boardId: activeBoard.id,
      collaborator,
      feedback,
      created_at: new Date().toISOString(),
    }

    updateActiveProject((project) => ({
      ...project,
      collaboratorNotes: [...(project.collaboratorNotes ?? []), note],
      canvasNodes: [...(project.canvasNodes ?? []), makeCanvasNode(activeBoard.id, 'note')],
    }))
  }

  const deleteCollaboratorNote = (noteId: string) => {
    if (isReadOnly) return
    updateActiveProject((project) => ({
      ...project,
      collaboratorNotes: (project.collaboratorNotes ?? []).filter((note) => note.id !== noteId),
    }))
  }

  const makeCanvasNode = (boardId: string, type: CanvasNode['type']): CanvasNode => ({
    id: makeId('node'),
    boardId,
    type,
    created_at: new Date().toISOString(),
  })

  const createAnalysisTextElement = (content: string, existingCount: number): ExcalidrawElement => {
    const [element] = convertToExcalidrawElements(
      [
        {
          type: 'text',
          id: makeId('ai-analysis'),
          x: 160 + (existingCount % 3) * 420,
          y: 160 + Math.floor(existingCount / 3) * 320,
          width: 360,
          text: content,
          fontSize: 20,
          fontFamily: 1,
          textAlign: 'left',
          verticalAlign: 'top',
          strokeColor: '#0f172a',
          backgroundColor: 'transparent',
        },
      ],
      { regenerateIds: false },
    )
    return element
  }

  const saveAiAnalysisNode = (content: string) => {
    const boardId = activeBoard?.id ?? activeProject.activeBoardId ?? activeProject.boards[0].id
    updateActiveProject((project) => ({
      ...project,
      canvasNodes: [...(project.canvasNodes ?? []), makeCanvasNode(boardId, 'ai_analysis')],
      insights: [
        ...(project.insights ?? []),
        {
          id: makeId('insight'),
          message: content,
          created_at: new Date().toISOString(),
        },
      ],
    }))
  }

  const runAiAction = async (action: AiAction, question = '') => {
    const now = new Date().toISOString()
    const prompt = question.trim()
    const userMessage: AiMessage = {
      id: makeId('ai-user'),
      role: 'user',
      content: prompt || copy[language][
        action === 'compare' ? 'compareSelected'
          : action === 'summarize' ? 'summarizeCanvas'
            : action === 'pattern' ? 'findPattern'
              : action === 'conflict' ? 'findConflict'
                : action === 'tasks' ? 'generateTasks'
                  : action === 'codexPrompt' ? 'exportPromptForCodex'
                    : 'analyzeSelected'
      ],
      createdAt: now,
    }
    setAiMessages((messages) => [...messages, userMessage])
    setAiBusy(true)

    const payload = {
      action,
      question: prompt,
      project: {
        id: activeProject.id,
        name: activeProject.name,
        currentStage: normalizeStage(activeProject.currentStage),
      },
      board: {
        id: activeBoard?.id,
        name: activeBoard?.name,
        elementCount: activeBoard?.canvas.elements.length ?? 0,
      },
      selectedContext,
    }

    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!response.ok) throw new Error(`AI API ${response.status}`)
      const data = await response.json() as { result?: string; message?: string }
      const result = data.result ?? data.message ?? createAiFallback({
        action,
        question: prompt,
        selectedCount: selectedContext.length,
        canvasCount: activeBoard?.canvas.elements.length ?? 0,
        language,
      })
      const assistantMessage: AiMessage = {
        id: makeId('ai-assistant'),
        role: 'assistant',
        content: result,
        createdAt: new Date().toISOString(),
      }
      setLatestAiResult(result)
      setAiMessages((messages) => [...messages, assistantMessage])
      saveAiAnalysisNode(result)
    } catch {
      const result = createAiFallback({
        action,
        question: prompt,
        selectedCount: selectedContext.length,
        canvasCount: activeBoard?.canvas.elements.length ?? 0,
        language,
      })
      const assistantMessage: AiMessage = {
        id: makeId('ai-assistant'),
        role: 'assistant',
        content: result,
        createdAt: new Date().toISOString(),
      }
      setLatestAiResult(result)
      setAiMessages((messages) => [...messages, assistantMessage])
      saveAiAnalysisNode(result)
    } finally {
      setAiBusy(false)
    }
  }

  const insertAiAnalysisIntoCanvas = () => {
    if (!latestAiResult || !activeBoard) return
    const element = createAnalysisTextElement(latestAiResult, activeBoard.canvas.elements.length)
    const nextCanvas = {
      ...activeBoard.canvas,
      elements: [...activeBoard.canvas.elements, element],
    }

    canvasSignatureRef.current = getSceneSignature(nextCanvas)
    updateActiveProject((project) => ({
      ...project,
      boards: project.boards.map((board) =>
        board.id === activeBoard.id
          ? {
              ...board,
              canvas: nextCanvas,
              updatedAt: new Date().toISOString(),
            }
          : board,
      ),
      canvasNodes: [...(project.canvasNodes ?? []), makeCanvasNode(activeBoard.id, 'ai_analysis')],
    }))

    excalidrawApiRef.current?.updateScene({
      elements: nextCanvas.elements,
      captureUpdate: CaptureUpdateAction.IMMEDIATELY,
    })
    excalidrawApiRef.current?.scrollToContent([element], {
      fitToContent: true,
    })
  }

  const updateCanvasSelection = (ids: string[]) => {
    setSelectedElementIds((currentIds) => {
      if (currentIds.length === ids.length && currentIds.every((id, index) => id === ids[index])) {
        return currentIds
      }
      return ids
    })
    const selectedElements = (activeBoard?.canvas.elements ?? []).filter((element) => ids.includes(element.id))
    const selectedAssetFromCanvas = selectedElements
      .map((element) => findAssetForElement(element, activeProject.assets))
      .find((asset): asset is ResearchAsset => Boolean(asset))
    if (selectedAssetFromCanvas) {
      setSelectedAssetId(selectedAssetFromCanvas.id)
    }
  }

  const insertAssetIntoCanvas = async (asset: ResearchAsset, projects = state.projects) => {
    setPendingAssetId(asset.id)
    const project = projects.find((item) => item.id === activeProject.id) ?? activeProject
    const boardId = project.activeBoardId ?? project.boards[0]?.id ?? ''
    const board = project.boards.find((item) => item.id === boardId) ?? project.boards[0]
    const canvas = board?.canvas ?? emptyCanvas()
    const alreadyInserted = canvas.elements.some((element) => element.id === `${asset.id}-image`)

    if (alreadyInserted) {
      setMode('canvas')
      excalidrawApiRef.current?.scrollToContent(canvas.elements, {
        fitToContent: true,
      })
      setPendingAssetId(undefined)
      return
    }

    const { element, file } = await createAssetImageScene(asset, canvas.elements.length)
    const nextCanvas = {
      elements: [...canvas.elements, element],
      files: {
        ...canvas.files,
        [file.id]: file,
      },
    }
    const nextProjects = projects.map((item) =>
      item.id === activeProject.id
        ? {
            ...item,
            boards: item.boards.map((boardItem) =>
              boardItem.id === board.id
                ? {
                    ...boardItem,
                    canvas: nextCanvas,
                    updatedAt: new Date().toISOString(),
                  }
                : boardItem,
            ),
            canvasNodes: [...(item.canvasNodes ?? []), makeCanvasNode(board.id, 'screenshot')],
          }
        : item,
    )

    canvasSignatureRef.current = getSceneSignature(nextCanvas)
    saveState({ ...state, projects: nextProjects })

    if (excalidrawApiRef.current && mode === 'canvas') {
      excalidrawApiRef.current.addFiles([file])
      excalidrawApiRef.current.updateScene({
        elements: nextCanvas.elements,
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      })
      excalidrawApiRef.current.scrollToContent([element], {
        fitToContent: true,
      })
    }

    setMode('canvas')
    setPendingAssetId(undefined)
  }

  const insertUrlIntoCanvas = useCallback((rawUrl: string, projects = state.projects) => {
    const url = normalizeUrl(rawUrl)
    if (!url) return

    const project = projects.find((item) => item.id === activeProject.id) ?? activeProject
    const boardId = project.activeBoardId ?? project.boards[0]?.id ?? ''
    const board = project.boards.find((item) => item.id === boardId) ?? project.boards[0]
    const canvas = board?.canvas ?? emptyCanvas()
    const element = createUrlEmbedElement(url, canvas.elements.length)
    const existingUrlAsset = project.assets.find((asset) => asset.source === url)
    const urlAsset = existingUrlAsset ?? createUrlAsset(url)
    const nextCanvas = {
      ...canvas,
      elements: [...canvas.elements, element],
    }
    const nextProjects = projects.map((item) =>
      item.id === activeProject.id
        ? {
            ...item,
            boards: item.boards.map((boardItem) =>
              boardItem.id === board.id
                ? {
                    ...boardItem,
                    canvas: nextCanvas,
                    updatedAt: new Date().toISOString(),
                  }
                : boardItem,
            ),
            assets: existingUrlAsset ? item.assets : [...item.assets, urlAsset],
            canvasNodes: [...(item.canvasNodes ?? []), makeCanvasNode(board.id, 'link')],
          }
        : item,
    )

    canvasSignatureRef.current = getSceneSignature(nextCanvas)
    saveState({ ...state, projects: nextProjects })

    if (excalidrawApiRef.current && mode === 'canvas') {
      excalidrawApiRef.current.updateScene({
        elements: nextCanvas.elements,
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      })
      excalidrawApiRef.current.scrollToContent([element], {
        fitToContent: true,
      })
    }

    setMode('canvas')
    setSelectedAssetId(urlAsset.id)
  }, [activeProject, mode, saveState, state])

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const target = event.target as HTMLElement | null
      if (
        target?.closest('input, textarea, [contenteditable="true"]')
      ) {
        return
      }

      const text = event.clipboardData?.getData('text/plain') ?? ''
      const url = normalizeUrl(text)
      if (!url) return

      event.preventDefault()
      insertUrlIntoCanvas(url)
    }

    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [insertUrlIntoCanvas])

  if (!activeProject) {
    return null
  }

  return (
    <div
      className={`app-shell ${isProjectPanelOpen ? '' : 'project-panel-collapsed'} ${isLibraryPanelOpen ? '' : 'library-panel-collapsed'}`}
      style={{
        '--project-panel-width': `${projectPanelWidth}px`,
        '--library-panel-width': `${libraryPanelWidth}px`,
      } as CSSProperties}
    >
      {isProjectPanelOpen ? (
        <ProjectRail
          activeBoardId={activeBoard?.id ?? ''}
          activeProjectId={activeProject.id}
          language={language}
          mode={mode}
          onCreateBoard={createBoard}
          onCreateProject={createProject}
          onDeleteBoard={deleteBoard}
          onDeleteProject={deleteProject}
          onDeleteBoardForever={deleteBoardForever}
          onHidePanel={() => setIsProjectPanelOpen(false)}
          onModeChange={setMode}
          onMoveProject={moveProject}
          onOpenBoardMenu={openBoardMenu}
          onRenameBoard={renameBoard}
          onRenameProject={renameProject}
          onRestoreBoard={restoreBoard}
          onSelectBoard={openProjectBoard}
          onSelectProject={(id) => {
            setActiveProjectId(id)
            const nextProject = state.projects.find((project) => project.id === id)
            setSelectedAssetId(nextProject?.assets[0]?.id ?? '')
            setMode('overview')
          }}
          onToggleLanguage={() => setLanguage((value) => value === 'en' ? 'zh' : 'en')}
          projects={state.projects}
        />
      ) : (
        <button
          aria-label={copy[language].showProjectPanel}
          className="floating-panel-toggle left"
          onClick={() => setIsProjectPanelOpen(true)}
          type="button"
        >
          <PanelLeft size={18} />
        </button>
      )}

      {isProjectPanelOpen ? (
        <div
          aria-label={language === 'en' ? 'Resize project panel' : '调整项目栏宽度'}
          className="panel-resizer project-panel-resizer"
          onPointerDown={(event) => startPanelResize('project', event)}
          role="separator"
          tabIndex={0}
        />
      ) : null}

      <section className="workspace">
        <TopBar
          cloudSync={cloudSync}
          isReadOnly={isReadOnly}
          language={language}
          onCreateBoard={() => createBoard(activeProject.id)}
          onExportJson={exportCurrentBoardJson}
          onExportPng={() => void exportCurrentBoardPng()}
          onSaveCloud={() => void saveCloudNow()}
          onShareLink={() => void shareReadOnlyLink()}
          project={activeProject}
        />
        {mode === 'canvas' ? (
          <BoardTabs
            activeBoardId={activeBoard?.id ?? ''}
            language={language}
            onOpenBoardMenu={openBoardMenu}
            onSelectBoard={openBoard}
            project={activeProject}
          />
        ) : null}
        <div className="workspace-body">
          {mode === 'overview' ? (
            <OverviewDashboard
              language={language}
              onAddTask={addTask}
              onAddTool={addTool}
              onCreateBoard={() => createBoard(activeProject.id)}
              onDeleteTask={deleteTask}
              onDeleteTool={deleteTool}
              onOpenBoard={openBoard}
              onSetStage={updateProjectStage}
              onSetStageStatus={updateProjectStageStatus}
              onImportTools={importToolsFromText}
              onUpdateQuestion={updateProjectQuestion}
              onUpdateTask={updateTask}
              onUpdateTool={updateTool}
              project={activeProject}
            />
          ) : activeBoard ? (
            <ExcalidrawCanvas
              board={activeBoard}
              isReadOnly={isReadOnly}
              key={`${activeProject.id}-${activeBoard?.id ?? 'board'}`}
              language={language}
              libraryItems={activeProject.libraryItems ?? []}
              projectId={activeProject.id}
              onInsertSelected={() => selectedAsset && void insertAssetIntoCanvas(selectedAsset)}
              onLibraryChange={(libraryItems) => {
                if (isReadOnly) return
                if (getLibraryItemsSignature(libraryItems) === getLibraryItemsSignature(activeProject.libraryItems ?? [])) return
                updateActiveProject((project) => ({
                  ...project,
                  libraryItems,
                }))
              }}
              onReady={(api) => {
                excalidrawApiRef.current = api
              }}
              onSelectionChange={updateCanvasSelection}
              onSceneChange={(canvas) => {
                const signature = getSceneSignature(canvas)
                if (signature === canvasSignatureRef.current) {
                  return
                }
                canvasSignatureRef.current = signature
                const boardId = activeBoard.id
                const previousCount = activeBoard?.canvas.elements.length ?? 0
                const previousElementIds = new Set((activeBoard?.canvas.elements ?? []).map((element) => element.id))
                const screenshotAssets = canvas.elements
                  .filter((element) => element.type === 'image' && !previousElementIds.has(element.id))
                  .filter((element) => !activeProject.assets.some((asset) => asset.id === `asset-${element.id}` || element.id === `${asset.id}-image`))
                  .map((element) => createScreenshotAsset(element, canvas.files))
                  .filter((asset): asset is ResearchAsset => Boolean(asset))
                const addedElements = Math.max(0, canvas.elements.length - previousCount)
                const nextNodes = [
                  ...Array.from({ length: addedElements }, () => makeCanvasNode(boardId, 'canvas_element')),
                  ...screenshotAssets.map(() => makeCanvasNode(boardId, 'screenshot')),
                ]
                saveState({
                  ...state,
                  projects: state.projects.map((project) =>
                    project.id === activeProject.id
                      ? {
                          ...project,
                          boards: project.boards.map((board) =>
                            board.id === boardId
                              ? {
                                  ...board,
                                  canvas,
                                  updatedAt: new Date().toISOString(),
                                }
                              : board,
                          ),
                          assets: screenshotAssets.length
                            ? [...project.assets, ...screenshotAssets]
                            : project.assets,
                          canvasNodes: nextNodes.length
                            ? [
                                ...(project.canvasNodes ?? []),
                                ...nextNodes,
                              ]
                            : project.canvasNodes,
                        }
                      : project,
                  ),
                })
                if (screenshotAssets.length) {
                  setSelectedAssetId(screenshotAssets[screenshotAssets.length - 1].id)
                }
              }}
              pendingAssetId={pendingAssetId}
              selectedAsset={selectedAsset}
            />
          ) : (
            <EmptyCanvasState language={language} onCreateBoard={() => createBoard(activeProject.id)} />
          )}

          {mode === 'canvas' && activeBoard && !isLibraryPanelOpen ? (
            <button
              aria-label={copy[language].showLibraryPanel}
              className="floating-panel-toggle right"
              onClick={() => setIsLibraryPanelOpen(true)}
              type="button"
            >
              <PanelRight size={18} />
              {copy[language].aiPartner}
            </button>
          ) : null}

          {mode === 'canvas' && activeBoard && isLibraryPanelOpen ? (
            <>
            <div
              aria-label={language === 'en' ? 'Resize library panel' : '调整资产栏宽度'}
              className="panel-resizer library-panel-resizer"
              onPointerDown={(event) => startPanelResize('library', event)}
              role="separator"
              tabIndex={0}
            />
            <AIPartnerPanel
              aiBusy={aiBusy}
              aiMessages={aiMessages}
              assets={activeProject.assets}
              collaboratorNotes={activeProject.collaboratorNotes ?? []}
              comments={activeProject.comments ?? []}
              currentBoardId={activeBoard?.id ?? ''}
              externalLibraries={externalLibraries}
              externalLibrariesLoading={externalLibrariesLoading}
              externalLibraryBusyId={externalLibraryBusyId}
              isReadOnly={isReadOnly}
              libraryItems={activeProject.libraryItems ?? []}
              latestAiResult={latestAiResult}
              language={language}
              onAddCollaboratorNote={addCollaboratorNote}
              onAddComment={addCanvasComment}
              onDeleteCollaboratorNote={deleteCollaboratorNote}
              onDeleteComment={deleteCanvasComment}
              onDeleteLibraryItems={deleteLibraryItems}
              onHidePanel={() => setIsLibraryPanelOpen(false)}
              onImportExternalLibrary={(library) => void importExternalLibrary(library)}
              onInsertAiResult={insertAiAnalysisIntoCanvas}
              onOpenExcalidrawLibrary={openExcalidrawLibrary}
              onRunAi={(action, question) => void runAiAction(action, question)}
              onSelectAsset={setSelectedAssetId}
              selectedAssetId={selectedAssetId}
              selectedContext={selectedContext}
            />
            </>
          ) : null}
        </div>
      </section>

      {boardMenu ? (
        <div
          className="board-context-menu"
          onClick={(event) => event.stopPropagation()}
          style={{ left: boardMenu.x, top: boardMenu.y }}
        >
          {(() => {
            const project = state.projects.find((item) => item.id === boardMenu.projectId)
            const board = project?.boards.find((item) => item.id === boardMenu.boardId)
            const canDelete = Boolean(board && project && activeBoardsOf(project).length > 1)

            return (
              <button
                disabled={!canDelete}
                onClick={() => deleteBoard(boardMenu.projectId, boardMenu.boardId)}
                type="button"
              >
                <Trash2 size={14} />
                {canDelete ? copy[language].deleteCanvas : copy[language].lastBoardCannotDelete}
              </button>
            )
          })()}
        </div>
      ) : null}

      {toast ? <div className="toast-message">{toast.message}</div> : null}
    </div>
  )
}

export default App

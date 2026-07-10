import type { Project } from './types'
import { alphaCompassArchitectureCanvas } from './alphaCompassArchitecture'

const now = new Date().toISOString()

const defaultBoards = (prefix: string) => [
  { id: `${prefix}-opportunity`, name: 'Opportunity', canvas: { elements: [], files: {} }, updatedAt: now },
  { id: `${prefix}-research-flow`, name: 'Research Flow', canvas: { elements: [], files: {} }, updatedAt: now },
  { id: `${prefix}-evidence`, name: 'Evidence', canvas: { elements: [], files: {} }, updatedAt: now },
  {
    id: `${prefix}-ui`,
    name: 'UI',
    canvas: prefix === 'alpha-compass' ? alphaCompassArchitectureCanvas : { elements: [], files: {} },
    updatedAt: now,
  },
]

const blankAnalysis = {
  task: 'Clarify the user goal this screen supports.',
  nextClick: 'Primary action is visually strongest; confirm with competitor flow.',
  hierarchy: 'Primary content first, supporting controls second, metadata last.',
  pattern: 'Inspector plus evidence card pattern.',
  borrow: 'Use the progressive disclosure and compact action row.',
  avoid: 'Do not copy the exact density until your own task frequency is known.',
}

export const seedProjects: Project[] = [
  {
    id: 'alpha-compass',
    name: 'Alpha Compass',
    type: 'Product research',
    activeBoardId: 'alpha-compass-ui',
    currentStage: 'Research',
    stageUpdatedAt: now,
    biggestQuestion: {
      biggest_question: '如何在保证信息深度的前提下，让普通用户在最短路径内找到投资机会并建立信心？',
      priority: 'High',
      updated_at: now,
    },
    tasks: [
      {
        id: 'task-watchlist',
        title: '研究 TradingView Watchlist 设计模式',
        type: 'Research',
        priority: 'High',
        status: 'Todo',
        due_date: now.slice(0, 10),
      },
      {
        id: 'task-evidence',
        title: '分析 Evidence Panel 交互逻辑',
        type: 'Research',
        priority: 'High',
        status: 'Doing',
        due_date: now.slice(0, 10),
      },
    ],
    canvasNodes: [
      { id: 'node-screenshot-1', boardId: 'alpha-compass-opportunity', type: 'screenshot', created_at: now },
      { id: 'node-link-1', boardId: 'alpha-compass-opportunity', type: 'link', created_at: now },
      { id: 'node-note-1', boardId: 'alpha-compass-research-flow', type: 'note', created_at: now },
      { id: 'node-ai-1', boardId: 'alpha-compass-evidence', type: 'ai_analysis', created_at: now },
    ],
    tools: [
      {
        id: 'tool-tradingview',
        name: 'TradingView',
        category: 'Market UI',
        url: 'https://www.tradingview.com/',
        purpose: '研究 watchlist 与图表探索交互',
        status: 'Studying',
      },
      {
        id: 'tool-excalidraw',
        name: 'Excalidraw',
        category: 'Canvas',
        url: 'https://excalidraw.com/',
        purpose: '白板和流程草图',
        status: 'Using',
      },
    ],
    insights: [],
    boards: defaultBoards('alpha-compass'),
    assets: [
      {
        id: 'asset-evidence-panel',
        title: 'Evidence panel inspector',
        source: 'Linear / Research tool pattern',
        image:
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 340"><rect width="520" height="340" fill="%23f7faf9"/><rect x="22" y="24" width="120" height="292" rx="10" fill="%23ffffff" stroke="%23dfe7e4"/><rect x="162" y="24" width="336" height="86" rx="10" fill="%23ffffff" stroke="%23dfe7e4"/><rect x="162" y="126" width="206" height="190" rx="10" fill="%23ffffff" stroke="%23dfe7e4"/><rect x="386" y="126" width="112" height="190" rx="10" fill="%23e8f5f1" stroke="%23cfe4dd"/><rect x="42" y="52" width="74" height="10" rx="5" fill="%23182720"/><rect x="42" y="84" width="72" height="8" rx="4" fill="%2389a29a"/><rect x="184" y="52" width="174" height="14" rx="7" fill="%23182720"/><rect x="184" y="78" width="250" height="8" rx="4" fill="%2392a6a0"/><rect x="184" y="154" width="150" height="12" rx="6" fill="%23182720"/><rect x="184" y="184" width="118" height="8" rx="4" fill="%2389a29a"/><rect x="408" y="154" width="60" height="60" rx="14" fill="%231ba784"/><path d="M422 184h32M438 168v32" stroke="white" stroke-width="8" stroke-linecap="round"/></svg>',
        tags: ['Evidence Panel', 'Inspector', 'Review Loop'],
        status: 'ai-ready',
        analysis: {
          ...blankAnalysis,
          task: 'Help the user inspect one selected evidence item without leaving the research list.',
          nextClick: 'The user will likely open the highlighted source or accept the suggested insight.',
          hierarchy: 'Title and summary dominate; source context and secondary metadata are quieter.',
          pattern: 'List-detail inspector with persistent project context.',
          borrow: 'Keep detail analysis adjacent to the screenshot so the mental jump stays small.',
          avoid: 'Avoid a heavy modal; it would break comparison work.',
        },
      },
      {
        id: 'asset-skill-tree',
        title: 'Skill tree progression map',
        source: 'Game onboarding / RPG UI',
        image:
          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 340"><rect width="520" height="340" fill="%23f8f7f2"/><path d="M104 244 C188 188 180 88 264 92 C348 96 320 202 424 178" fill="none" stroke="%23c9b77d" stroke-width="10" stroke-linecap="round"/><g fill="%23ffffff" stroke="%2330261a" stroke-width="5"><circle cx="104" cy="244" r="34"/><circle cx="180" cy="168" r="34"/><circle cx="264" cy="92" r="34"/><circle cx="334" cy="154" r="34"/><circle cx="424" cy="178" r="34"/></g><g fill="%230f766e"><circle cx="104" cy="244" r="13"/><circle cx="180" cy="168" r="13"/><circle cx="264" cy="92" r="13"/><circle cx="334" cy="154" r="13"/><circle cx="424" cy="178" r="13"/></g><rect x="48" y="34" width="174" height="34" rx="8" fill="%23ffffff" stroke="%23ded7bd"/><rect x="64" y="46" width="104" height="9" rx="4" fill="%232f2a20"/></svg>',
        tags: ['Skill Tree', 'Map Exploration'],
        status: 'manual',
        analysis: {
          ...blankAnalysis,
          task: 'Show progress options and future unlocks as a spatial decision.',
          nextClick: 'The user will inspect the next reachable node.',
          hierarchy: 'Unlocked nodes get strongest contrast; locked path remains visible but subdued.',
          pattern: 'Branching progression map.',
          borrow: 'Use visible future states to create motivation.',
          avoid: 'Avoid decorative nodes without meaningful choice.',
        },
      },
    ],
  },
  {
    id: 'game-lab',
    name: '你的游戏',
    type: 'Game UI research',
    activeBoardId: 'game-lab-opportunity',
    currentStage: 'Idea',
    stageUpdatedAt: now,
    biggestQuestion: { biggest_question: '', priority: 'Medium', updated_at: now },
    tasks: [],
    canvasNodes: [],
    tools: [],
    insights: [],
    boards: defaultBoards('game-lab'),
    assets: [],
  },
  {
    id: 'english-tool',
    name: '英语工具',
    type: 'Learning product',
    activeBoardId: 'english-tool-opportunity',
    currentStage: 'Idea',
    stageUpdatedAt: now,
    biggestQuestion: { biggest_question: '', priority: 'Medium', updated_at: now },
    tasks: [],
    canvasNodes: [],
    tools: [],
    insights: [],
    boards: defaultBoards('english-tool'),
    assets: [],
  },
  {
    id: 'agent-notes',
    name: '公众号 Agent',
    type: 'Agent workflow',
    activeBoardId: 'agent-notes-opportunity',
    currentStage: 'Idea',
    stageUpdatedAt: now,
    biggestQuestion: { biggest_question: '', priority: 'Medium', updated_at: now },
    tasks: [],
    canvasNodes: [],
    tools: [],
    insights: [],
    boards: defaultBoards('agent-notes'),
    assets: [],
  },
]

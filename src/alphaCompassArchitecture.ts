import type { CanvasScene } from './types'

export const alphaCompassArchitectureMarkerId = 'alpha-compass-architecture-marker'

let idCounter = 0

const timestamp = 1_788_537_600_000

const nextId = (prefix: string) => `${prefix}-${idCounter++}`

const baseElement = (
  type: string,
  x: number,
  y: number,
  width: number,
  height: number,
  strokeColor = '#1e1e1e',
  backgroundColor = 'transparent',
) => ({
  id: nextId(`alpha-${type}`),
  type,
  x,
  y,
  width,
  height,
  angle: 0,
  strokeColor,
  backgroundColor,
  fillStyle: 'solid',
  strokeWidth: 2,
  strokeStyle: 'solid',
  roughness: 0,
  opacity: 100,
  groupIds: [],
  frameId: null,
  roundness: type === 'rectangle' ? { type: 3 } : null,
  seed: 900_000 + idCounter,
  version: 1,
  versionNonce: 700_000 + idCounter,
  isDeleted: false,
  boundElements: null,
  updated: timestamp,
  link: null,
  locked: false,
})

const rectangle = (
  x: number,
  y: number,
  width: number,
  height: number,
  backgroundColor = '#ffffff',
  strokeColor = '#1e1e1e',
) => ({
  ...baseElement('rectangle', x, y, width, height, strokeColor, backgroundColor),
})

const text = (
  x: number,
  y: number,
  value: string,
  fontSize = 22,
  strokeColor = '#1e1e1e',
  width = Math.max(120, value.length * fontSize * 0.62),
) => ({
  ...baseElement('text', x, y, width, Math.ceil(fontSize * 1.3), strokeColor),
  strokeWidth: 1,
  fontSize,
  fontFamily: 2,
  text: value,
  rawText: value,
  originalText: value,
  textAlign: 'left',
  verticalAlign: 'top',
  containerId: null,
  lineHeight: 1.25,
  baseline: Math.round(fontSize * 1.08),
})

const arrow = (x1: number, y1: number, x2: number, y2: number, strokeColor = '#475569') => ({
  ...baseElement('arrow', x1, y1, x2 - x1, y2 - y1, strokeColor),
  points: [[0, 0], [x2 - x1, y2 - y1]],
  startBinding: null,
  endBinding: null,
  startArrowhead: null,
  endArrowhead: 'arrow',
  elbowed: false,
})

const addBox = (
  elements: unknown[],
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  lines: string[],
  fill = '#ffffff',
  stroke = '#263238',
) => {
  elements.push(rectangle(x, y, width, height, fill, stroke))
  elements.push(text(x + 18, y + 16, title, 22, '#111827', width - 36))
  lines.forEach((line, index) => {
    elements.push(text(x + 18, y + 56 + index * 26, line, 17, '#475569', width - 36))
  })
}

const addSmallNode = (
  elements: unknown[],
  x: number,
  y: number,
  label: string,
  subtitle: string,
  fill = '#f8fafc',
) => {
  elements.push(rectangle(x, y, 150, 78, fill, '#334155'))
  elements.push(text(x + 14, y + 14, label, 19, '#0f172a', 122))
  elements.push(text(x + 14, y + 44, subtitle, 14, '#64748b', 122))
}

const createAlphaCompassArchitectureElements = () => {
  idCounter = 0
  const elements: unknown[] = []

  elements.push(rectangle(40, 30, 1280, 70, '#111827', '#111827'))
  elements.push({
    ...text(68, 50, 'Alpha Compass Architecture｜Evidence First, Rule First, AI Last', 30, '#ffffff', 940),
    id: alphaCompassArchitectureMarkerId,
  })
  elements.push(text(1040, 56, '结构化架构图，不是发散脑图', 18, '#cbd5e1', 230))

  elements.push(text(60, 130, '1. 用户每天打开后的主路径', 24, '#0f172a', 360))
  const flowY = 170
  const flowXs = [60, 230, 400, 570, 740, 910, 1080]
  const flowLabels = [
    ['100美元用户', '本金/偏好/懒人模式'],
    ['Opportunity Universe', '今日全量可研究池'],
    ['Asset Detail', '默认浅层判断'],
    ['Evidence Panel', '点击证据包'],
    ['Thesis Ticket', '形成假设'],
    ['Simulation', '先模拟$10'],
    ['Review Inbox', '复盘再迭代'],
  ]
  flowLabels.forEach(([label, subtitle], index) => {
    addSmallNode(elements, flowXs[index], flowY, label, subtitle, index === 0 ? '#fef3c7' : '#f8fafc')
    if (index > 0) elements.push(arrow(flowXs[index - 1] + 150, flowY + 39, flowXs[index] - 8, flowY + 39))
  })

  elements.push(text(60, 300, '2. 前端交互层：Progressive Exploration', 24, '#0f172a', 460))
  addBox(elements, 60, 340, 380, 250, 'Asset Detail 第一屏', [
    '只显示：当前判断 / 核心原因 / 核心风险',
    '每个原因、风险、概念都能点开',
    '不是 Tab：不是 Overview / Raw Data',
    '下一步：展开证据链 / 加入队列 / 模拟',
  ], '#ecfeff', '#0e7490')
  addBox(elements, 490, 340, 360, 250, 'Node-based Drilldown', [
    '点击节点不跳走，在右侧展开',
    '保留 Exploration Trail',
    'NVDA → AI Infrastructure → CapEx',
    '像剥洋葱：结论 → 证据 → 原始来源',
  ], '#f0fdf4', '#15803d')
  addBox(elements, 900, 340, 380, 250, '可爱/奇怪/高雅表格', [
    '机会表：资产、热度、风险、证据强度',
    '历史表：周期、事件、心理、政策',
    '模拟表：下注、回撤、复盘、规则命中',
    '表格是主界面，不是后台附属物',
  ], '#fff7ed', '#c2410c')
  elements.push(arrow(440, 465, 490, 465, '#0f766e'))
  elements.push(arrow(850, 465, 900, 465, '#0f766e'))

  elements.push(text(60, 640, '3. 核心数据模型：Node = Database Entity', 24, '#0f172a', 520))
  addBox(elements, 60, 680, 390, 280, 'Knowledge Graph / Entity Graph', [
    'entities: 公司、行业、人物、技术、政策、历史事件',
    'relationships: belongs_to / driven_by / supported_by',
    'evidence: 指标、新闻、财报摘录、可信度',
    'assets: NVDA / ETH / ETF / Web3 协议',
    '节点必须有 entity_id，不是搜索关键词',
  ], '#f8fafc', '#334155')
  addBox(elements, 500, 680, 360, 280, 'Evidence Panel = 证据包', [
    'Claim / 结论',
    'Related Entities / 关联对象',
    'Evidence Items / 指标和摘录',
    'Raw Sources 挂在 evidence item 下',
    'Updated At + Confidence',
  ], '#faf5ff', '#7e22ce')
  addBox(elements, 910, 680, 370, 280, '用户研究数据', [
    'Watchlist',
    'Research Queue',
    'Simulation',
    'Review',
    'Preference Memory',
    '你的投资过程比全量行情更应该被存',
  ], '#fdf2f8', '#be185d')
  elements.push(arrow(450, 820, 500, 820, '#7c3aed'))
  elements.push(arrow(860, 820, 910, 820, '#7c3aed'))

  elements.push(text(60, 1010, '4. 后端架构：轻存储 + 按需抓取 + 缓存 + 规则判断', 24, '#0f172a', 720))
  addBox(elements, 60, 1050, 300, 250, 'Entity Resolver', [
    '1. 查本地 entities / evidence',
    '2. 没有或过期再调用 connector',
    '3. 标准化为 Entity Detail',
    '4. 写入 cache / evidence index',
  ], '#eef2ff', '#4338ca')
  addBox(elements, 405, 1050, 300, 250, 'Rule Engine', [
    'PE 高 + 增速强 = 值得看但估值风险',
    '资金流 / 动量 / 拥挤度 / 财报变化',
    '先规则判断，避免 AI 乱猜',
    '输出可解释的规则命中',
  ], '#f0fdf4', '#166534')
  addBox(elements, 750, 1050, 250, 250, 'Cache Tables', [
    'market_cache',
    'news_cache',
    'financials_cache',
    'crypto_cache',
    'TTL: 1h / 1d / 1w',
  ], '#fefce8', '#a16207')
  addBox(elements, 1045, 1050, 235, 250, 'AI API 可选', [
    '只在用户点“解释”时调用',
    '总结 / 翻译 / 类比 / 风险提示',
    '不负责凭空选股',
    '成本预算可控',
  ], '#fff1f2', '#be123c')
  elements.push(arrow(360, 1175, 405, 1175, '#334155'))
  elements.push(arrow(705, 1175, 750, 1175, '#334155'))
  elements.push(arrow(1000, 1175, 1045, 1175, '#334155'))

  elements.push(text(60, 1360, '5. 开源数据源和模型：站在巨人的肩膀上', 24, '#0f172a', 560))
  addBox(elements, 60, 1400, 260, 215, '股票 / 财报', [
    'FinanceDatabase: 公司池和分类',
    'yahooquery / yfinance: 行情、profile、财务',
    'edgartools: SEC 10-K / 10-Q',
    'OpenBB: 统一金融数据入口',
  ], '#f8fafc', '#334155')
  addBox(elements, 365, 1400, 260, 215, 'Web3 / 链上', [
    'CoinGecko: token 基础资料',
    'DefiLlama: TVL / 协议 / 收入',
    'The Graph / Dune: 链上查询',
    'Etherscan: 合约和交易',
  ], '#f8fafc', '#334155')
  addBox(elements, 670, 1400, 260, 215, '模型 / 回测', [
    'Qlib: 量化模型和因子',
    'VectorBT: 策略回测',
    'PyPortfolioOpt: 组合优化',
    '规则层优先于 AI 层',
  ], '#f8fafc', '#334155')
  addBox(elements, 975, 1400, 305, 215, '新闻 / 网页抓取', [
    'RSSHub: 新闻源订阅',
    'Firecrawl / Crawl4AI: 网页结构化',
    'Playwright: 页面验证和截图',
    '只存索引、摘要、链接、可信度',
  ], '#f8fafc', '#334155')

  elements.push(text(60, 1665, '6. MVP 边界：第一版先做一条完整闭环', 24, '#0f172a', 560))
  addBox(elements, 60, 1705, 380, 230, '必须做', [
    'Opportunity Universe 全量研究池',
    'NVDA/ETH 等 Asset Detail',
    'Evidence Panel + Entity Trail',
    'Research Queue + Simulation + Review',
  ], '#dcfce7', '#15803d')
  addBox(elements, 490, 1705, 360, 230, '先不做', [
    '自动真实交易',
    '全市场分钟级数据仓库',
    '让 AI 自己凭空推荐',
    '过早做复杂权限和社交系统',
  ], '#fee2e2', '#b91c1c')
  addBox(elements, 900, 1705, 380, 230, '成功标准', [
    '用户懒也能找到“所有值得研究对象”',
    '每个结论都能一路钻到证据',
    '模拟和复盘推动真实学习',
    'AI 成本低且解释可追溯',
  ], '#e0f2fe', '#0369a1')

  elements.push(rectangle(60, 1990, 1220, 120, '#111827', '#111827'))
  elements.push(text(90, 2020, '产品原则', 25, '#ffffff', 140))
  elements.push(text(250, 2018, '默认浅层判断；每个结论、每个词、每条证据都能继续点开。', 22, '#e5e7eb', 780))
  elements.push(text(250, 2055, '数据库像“图书馆目录 + 研究笔记”，不是把整个金融世界搬进来。', 20, '#cbd5e1', 820))
  elements.push(text(250, 2088, 'Evidence First → Rule First → Open-source Model → AI Last → Simulation Before Real Money', 20, '#bfdbfe', 900))

  return elements
}

export const alphaCompassArchitectureCanvas: CanvasScene = {
  elements: createAlphaCompassArchitectureElements() as CanvasScene['elements'],
  files: {},
}

export const hasAlphaCompassArchitecture = (canvas?: CanvasScene) =>
  Boolean(canvas?.elements.some((element) => element.id === alphaCompassArchitectureMarkerId))

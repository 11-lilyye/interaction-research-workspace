import type { BinaryFiles } from '@excalidraw/excalidraw/types'
import type { LibraryItems } from '@excalidraw/excalidraw/types'
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types'

export type Analysis = {
  task: string
  nextClick: string
  hierarchy: string
  pattern: string
  borrow: string
  avoid: string
}

export type ResearchAsset = {
  id: string
  title: string
  source: string
  image: string
  tags: string[]
  status: 'manual' | 'ai-ready' | 'draft'
  analysis: Analysis
}

export type Project = {
  id: string
  name: string
  type: string
  assets: ResearchAsset[]
  boards: Board[]
  activeBoardId?: string
  canvas?: CanvasScene
  currentStage?: ProjectStageName
  stageStatuses?: Partial<Record<ProjectStageName, ProjectStageStatus>>
  stageUpdatedAt?: string
  biggestQuestion?: ProjectQuestion
  tasks?: ProjectTask[]
  canvasNodes?: CanvasNode[]
  tools?: ProjectTool[]
  insights?: ProjectInsight[]
  comments?: CanvasComment[]
  collaboratorNotes?: CollaboratorNote[]
  libraryItems?: LibraryItems
}

export type Board = {
  id: string
  name: string
  canvas: CanvasScene
  updatedAt?: string
  thumbnail?: string
  deletedAt?: string
}

export type CanvasScene = {
  elements: readonly ExcalidrawElement[]
  files: BinaryFiles
}

export type ProjectStageName =
  | 'Idea'
  | 'Research'
  | 'Blueprint'
  | 'Prototype'
  | 'Build'
  | 'Iterate'
  | 'Launch'

export type ProjectStageStatus = 'Not Started' | 'In Progress' | 'Done' | 'Revisit'

export type ProjectQuestion = {
  biggest_question: string
  priority: 'High' | 'Medium' | 'Low'
  updated_at: string
}

export type ProjectTask = {
  id: string
  title: string
  type: 'Research' | 'Canvas' | 'Code' | 'Design' | 'Review'
  priority: 'High' | 'Medium' | 'Low'
  status: 'Todo' | 'Doing' | 'Done'
  due_date: string
}

export type CanvasNode = {
  id: string
  boardId: string
  type: 'screenshot' | 'link' | 'note' | 'canvas_element' | 'ai_analysis'
  created_at: string
}

export type ProjectTool = {
  id: string
  name: string
  category: string
  url: string
  icon_url?: string
  purpose: string
  status: 'Saved' | 'Studying' | 'Using' | 'Later'
}

export type ProjectInsight = {
  id: string
  message: string
  created_at: string
}

export type CanvasComment = {
  id: string
  boardId: string
  elementId?: string
  author: string
  body: string
  created_at: string
}

export type CollaboratorNote = {
  id: string
  boardId: string
  collaborator: string
  feedback: string
  created_at: string
}

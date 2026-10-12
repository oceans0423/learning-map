import { courses } from '../data/courses'
const validIds = new Set(courses.map((course) => course.id))
export interface CollectionState {
  ids: string[]
  undo: { id: string; index: number } | null
  message: string
}
export const EMPTY_COLLECTION: CollectionState = { ids: [], undo: null, message: '' }
export type CollectionAction = { type: 'add' | 'remove'; id: string } | { type: 'undo' }
export function collectionReducer(
  state: CollectionState,
  action: CollectionAction,
): CollectionState {
  if (action.type === 'undo') {
    if (!state.undo) return state
    const ids = state.ids.filter((id) => id !== state.undo!.id)
    ids.splice(Math.min(state.undo.index, ids.length), 0, state.undo.id)
    return {
      ids,
      undo: null,
      message: `已復原「${courses.find((course) => course.id === state.undo!.id)!.name}」，目前 ${ids.length} 門。`,
    }
  }
  if (!validIds.has(action.id)) return state
  const name = courses.find((course) => course.id === action.id)!.name
  const index = state.ids.indexOf(action.id)
  if (action.type === 'add') {
    if (index >= 0) return state
    const ids = [...state.ids, action.id]
    return { ...state, ids, message: `已收藏「${name}」，目前 ${ids.length} 門。` }
  }
  if (index < 0) return state
  const ids = state.ids.filter((id) => id !== action.id)
  return {
    ids,
    undo: { id: action.id, index },
    message: `已移除「${name}」，目前 ${ids.length} 門；可復原最近一次移除。`,
  }
}

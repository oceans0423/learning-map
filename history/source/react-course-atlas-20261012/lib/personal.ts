import {
  collectionReducer,
  EMPTY_COLLECTION,
  type CollectionAction,
  type CollectionState,
} from './collection'
import { boundedName, chronologicalStars, UNNAMED_CONSTELLATION } from './constellation'
import { boundPoint } from './starPosition'
export interface StarPosition {
  id: string
  x: number
  y: number
}
export interface PersonalState extends CollectionState {
  representatives: StarPosition[]
  initialized: boolean
  name: string
  namedOnce: boolean
  completed: boolean
  undo:
    | (NonNullable<CollectionState['undo']> & {
        representative?: { star: StarPosition; index: number }
      })
    | null
}
export const EMPTY_PERSONAL: PersonalState = {
  ...EMPTY_COLLECTION,
  representatives: [],
  initialized: false,
  name: UNNAMED_CONSTELLATION,
  namedOnce: false,
  completed: false,
}
const positions = [
  [0.22, 0.16],
  [0.7, 0.21],
  [0.27, 0.36],
  [0.78, 0.42],
  [0.21, 0.58],
  [0.72, 0.63],
  [0.3, 0.8],
  [0.76, 0.84],
] as const
export type PersonalAction =
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'name'; value: string }
  | CollectionAction
  | { type: 'initialize' }
  | { type: 'representative'; id: string }
  | { type: 'replace'; oldId: string; newId: string }
export function personalReducer(state: PersonalState, action: PersonalAction): PersonalState {
  if (action.type === 'move') {
    if (
      !Number.isFinite(action.x) ||
      !Number.isFinite(action.y) ||
      !state.representatives.some((star) => star.id === action.id)
    )
      return state
    const point = boundPoint(action)
    return {
      ...state,
      representatives: state.representatives.map((star) =>
        star.id === action.id ? { ...star, ...point } : star,
      ),
    }
  }
  if (action.type === 'name') {
    if (!state.representatives.length)
      return { ...state, message: '先選至少一顆代表星，再完成作品。' }
    const name = boundedName(action.value)
    return {
      ...state,
      name: name || UNNAMED_CONSTELLATION,
      namedOnce: state.namedOnce || !!name,
      completed: true,
      message: name
        ? '已更新星座名稱；連線是個人探索想像。'
        : '使用「未命名星座」；可以隨時改名。',
    }
  }
  if (action.type === 'initialize') {
    if (state.initialized || !state.ids.length) return state
    return {
      ...state,
      initialized: true,
      representatives: chronologicalStars(
        state.ids.slice(0, 8).map((id) => ({ id, x: 0, y: 0 })),
      ).map((star, index) => ({ id: star.id, x: positions[index][0], y: positions[index][1] })),
    }
  }
  if (action.type === 'representative') {
    if (!state.ids.includes(action.id)) return state
    if (state.representatives.some((star) => star.id === action.id))
      return {
        ...state,
        representatives: state.representatives.filter((star) => star.id !== action.id),
      }
    if (state.representatives.length >= 8)
      return { ...state, message: '代表星已達八顆，請明確選擇替換或取消。' }
    const index = state.representatives.length
    const position =
      positions.find(
        ([x, y]) => !state.representatives.some((star) => star.x === x && star.y === y),
      ) ?? positions[index]
    return {
      ...state,
      representatives: [
        ...state.representatives,
        { id: action.id, x: position[0], y: position[1] },
      ],
    }
  }
  if (action.type === 'replace') {
    if (
      !state.ids.includes(action.newId) ||
      state.representatives.some((star) => star.id === action.newId) ||
      !state.representatives.some((star) => star.id === action.oldId)
    )
      return state
    return {
      ...state,
      representatives: state.representatives.map((star) =>
        star.id === action.oldId ? { ...star, id: action.newId } : star,
      ),
      message: '已替換代表星；原課程仍保留收藏。',
    }
  }
  if (
    action.type === 'undo' &&
    state.undo?.representative &&
    state.representatives.length >= 8 &&
    !state.representatives.some((star) => star.id === state.undo!.id)
  )
    return {
      ...state,
      message: '代表星已滿，請先在編輯器移除一顆代表星，再復原；尚未改動作品。',
    }
  const collection = collectionReducer(state, action)
  if (collection === state) return state
  if (action.type === 'remove') {
    const index = state.representatives.findIndex((star) => star.id === action.id)
    return {
      ...state,
      ...collection,
      representatives: state.representatives.filter((star) => star.id !== action.id),
      undo: collection.undo
        ? {
            ...collection.undo,
            ...(index >= 0
              ? { representative: { star: state.representatives[index], index } }
              : {}),
          }
        : null,
    }
  }
  if (action.type === 'undo' && state.undo?.representative) {
    const stars = state.representatives.filter((star) => star.id !== state.undo!.id)
    stars.splice(
      Math.min(state.undo.representative.index, stars.length),
      0,
      state.undo.representative.star,
    )
    return { ...state, ...collection, representatives: stars }
  }
  return { ...state, ...collection, undo: action.type === 'add' ? state.undo : collection.undo }
}

import { courses } from '../data/courses'
import { boundedName } from './constellation'
import { EMPTY_PERSONAL, type PersonalState, type StarPosition } from './personal'
import { STAR_BOUNDS } from './starPosition'

export const PERSONAL_STORAGE_KEY = 'humanities-atlas:personal:v1'
interface StoredPersonal {
  version: 1
  consent: boolean
  ids: string[]
  representatives: StarPosition[]
  name: string
  initialized: boolean
  namedOnce: boolean
  completed: boolean
}
const knownIds = new Set(courses.map((course) => course.id))
export function serializePersonal(state: PersonalState, consent: boolean): string {
  const { ids, representatives, name, initialized, namedOnce, completed } = state
  return JSON.stringify({
    version: 1,
    consent,
    ids,
    representatives,
    name,
    initialized,
    namedOnce,
    completed,
  } satisfies StoredPersonal)
}
export function parsePersonal(raw: string): { state: PersonalState; consent: boolean } | null {
  try {
    const value: unknown = JSON.parse(raw)
    if (!value || typeof value !== 'object') return null
    const data = value as Record<string, unknown>
    if (
      data.version !== 1 ||
      typeof data.consent !== 'boolean' ||
      !Array.isArray(data.ids) ||
      data.ids.length > 69 ||
      !Array.isArray(data.representatives) ||
      data.representatives.length > 8 ||
      typeof data.name !== 'string' ||
      boundedName(data.name) !== data.name ||
      !data.name ||
      ['initialized', 'namedOnce', 'completed'].some((key) => typeof data[key] !== 'boolean')
    )
      return null
    const ids: string[] = []
    for (const id of data.ids) {
      if (typeof id !== 'string' || !knownIds.has(id)) return null
      if (!ids.includes(id)) ids.push(id)
    }
    const stars: StarPosition[] = []
    for (const value of data.representatives) {
      if (!value || typeof value !== 'object') return null
      const star = value as Record<string, unknown>
      if (
        typeof star.id !== 'string' ||
        !ids.includes(star.id) ||
        stars.some((item) => item.id === star.id) ||
        typeof star.x !== 'number' ||
        typeof star.y !== 'number' ||
        !Number.isFinite(star.x) ||
        !Number.isFinite(star.y) ||
        star.x < STAR_BOUNDS.minX ||
        star.x > STAR_BOUNDS.maxX ||
        star.y < STAR_BOUNDS.minY ||
        star.y > STAR_BOUNDS.maxY
      )
        return null
      stars.push({ id: star.id, x: star.x, y: star.y })
    }
    if ((!data.initialized && stars.length) || (data.namedOnce && !data.completed)) return null
    return {
      consent: data.consent,
      state: {
        ...EMPTY_PERSONAL,
        ids,
        representatives: stars,
        name: data.name,
        initialized: data.initialized as boolean,
        namedOnce: data.namedOnce as boolean,
        completed: data.completed as boolean,
      },
    }
  } catch {
    return null
  }
}
export function loadPersonal(): { state: PersonalState; enabled: boolean; message: string } {
  try {
    const raw = window.localStorage.getItem(PERSONAL_STORAGE_KEY)
    if (raw === null) return { state: EMPTY_PERSONAL, enabled: false, message: '' }
    const parsed = parsePersonal(raw)
    if (!parsed)
      return {
        state: EMPTY_PERSONAL,
        enabled: false,
        message: '裝置存檔格式無法讀取，已使用空白工作階段；原存檔未覆寫，可選擇刪除。',
      }
    return parsed.consent
      ? { state: parsed.state, enabled: true, message: '已還原此裝置的作品；本機保存已開啟。' }
      : {
          state: EMPTY_PERSONAL,
          enabled: false,
          message: '本機保存已停用；舊存檔保留但不自動還原，可另行刪除。',
        }
  } catch {
    return {
      state: EMPTY_PERSONAL,
      enabled: false,
      message: '無法存取本機儲存；仍可找課與編輯工作階段草稿。',
    }
  }
}

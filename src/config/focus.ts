import { ROLES } from './roles'
import { TRACKS, type TrackId } from './tracks'
import type { Role } from './roles'

export type StructuralRole = Extract<Role, 'foundation' | 'integration'>
export type FocusId = StructuralRole | TrackId
export type FocusOption =
  | { id: StructuralRole; kind: 'role'; label: string; urlValue: StructuralRole }
  | { id: TrackId; kind: 'track'; label: string; urlValue: TrackId }

// PRD §6.3 結構圖五個互動區，以及 §6.6 focus 參數，皆由此表取得。
const structuralRoles = ROLES.filter(
  (role): role is (typeof ROLES)[number] & { id: StructuralRole } =>
    role.id === 'foundation' || role.id === 'integration',
)

export const FOCUS_OPTIONS: readonly FocusOption[] = [
  ...structuralRoles.map((role) => ({
    id: role.id,
    kind: 'role' as const,
    label: role.id === 'foundation' ? '共同基底' : '整合成果',
    urlValue: role.id,
  })),
  ...TRACKS.map((track) => ({
    id: track.id,
    kind: 'track' as const,
    label: track.name,
    urlValue: track.id,
  })),
]

export const FOCUS_IDS: readonly FocusId[] = [
  ...structuralRoles.map((role) => role.id),
  ...TRACKS.map((track) => track.id),
]

const focusByUrlValue: ReadonlyMap<string, FocusOption> = new Map(
  FOCUS_OPTIONS.map((option) => [option.urlValue, option]),
)

/** URL focus values intentionally use stable role/track IDs, never display labels. */
export function focusFromUrl(value: string): FocusOption | undefined {
  return focusByUrlValue.get(value)
}

export function focusToUrl(id: FocusId): string {
  const option = FOCUS_OPTIONS.find((candidate) => candidate.id === id)
  if (!option) throw new Error(`Unknown focus ID: ${id}`)
  return option.urlValue
}

// 課程作用（PRD §4.2）。與必修／選修為獨立屬性。
export const ROLES = [
  {
    id: 'foundation',
    label: '基底',
    visual: { accent: '#45634f', soft: '#e8efe9', border: '#b1c5b5', onAccent: '#ffffff' },
  },
  {
    id: 'application',
    label: '應用',
    visual: { accent: '#a35d2b', soft: '#f5ebe2', border: '#dbb99f', onAccent: '#ffffff' },
  },
  {
    id: 'integration',
    label: '整合',
    visual: { accent: '#665486', soft: '#eeeaf4', border: '#c5b9d9', onAccent: '#ffffff' },
  },
] as const

export type Role = (typeof ROLES)[number]['id']

export const ROLE_IDS: readonly Role[] = ROLES.map((r) => r.id)

export const ROLES_BY_ID: Readonly<Record<Role, (typeof ROLES)[number]>> = Object.fromEntries(
  ROLES.map((role) => [role.id, role]),
) as Record<Role, (typeof ROLES)[number]>

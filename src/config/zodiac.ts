export const ZODIAC_IDS = [
  'aries',
  'taurus',
  'gemini',
  'cancer',
  'leo',
  'virgo',
  'libra',
  'scorpio',
  'sagittarius',
  'capricorn',
  'aquarius',
  'pisces',
] as const
export type ZodiacId = (typeof ZODIAC_IDS)[number]
export function isZodiacId(value: unknown): value is ZodiacId {
  return typeof value === 'string' && (ZODIAC_IDS as readonly string[]).includes(value)
}

export const ZODIAC_TOPICS = {
  research: '深度研究',
  expression: '敘事表達',
  media: '媒介傳播',
  technology: '數位實驗',
  aesthetics: '美感設計',
  community: '地方社會',
  heritage: '文化記憶',
  care: '人本關懷',
  planning: '企劃實作',
  language: '語言轉譯',
  nature: '自然永續',
  critique: '議題思辨',
} as const
export type ZodiacTopic = keyof typeof ZODIAC_TOPICS
export interface ZodiacProfile {
  id: ZodiacId
  label: string
  theme: string
  traits: string
  tagline: string
  description: string
  weights: Partial<Record<ZodiacTopic, number>>
  interpretations: Partial<Record<ZodiacTopic, string>>
  exampleIds: string[]
  points: [number, number][]
  edges: [number, number][]
  fillOrder?: number[]
}
export interface ZodiacCourseTheme {
  id: string
  tags: ZodiacTopic[]
  reason: string
}

/** Primary (3) and secondary (2) themes can include a course; accent (1) alone cannot. */
export function zodiacConnectionTags(
  profile: Pick<ZodiacProfile, 'weights'>,
  tags: readonly ZodiacTopic[],
) {
  return tags
    .filter((tag) => (profile.weights[tag] ?? 0) > 0)
    .sort((a, b) => (profile.weights[b] ?? 0) - (profile.weights[a] ?? 0))
}
export function belongsToZodiac(
  profile: Pick<ZodiacProfile, 'weights'>,
  tags: readonly ZodiacTopic[],
) {
  return tags.some((tag) => (profile.weights[tag] ?? 0) >= 2)
}

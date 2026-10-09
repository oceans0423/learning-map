export const SIGNALS = [
  { id: 'text', label: '文本思辨', question: '讀懂文字、語言與思想' },
  { id: 'story', label: '敘事創作', question: '把觀察和想法說成故事' },
  { id: 'digital', label: '數位媒介', question: '讓人文與科技產生新連結' },
  { id: 'field', label: '文化現場', question: '走進地方、文化與社會' },
] as const

export type SignalId = (typeof SIGNALS)[number]['id']
export const SIGNAL_IDS: readonly SignalId[] = SIGNALS.map((signal) => signal.id)
export const SIGNAL_BY_ID = Object.fromEntries(
  SIGNALS.map((signal) => [signal.id, signal]),
) as Record<SignalId, (typeof SIGNALS)[number]>

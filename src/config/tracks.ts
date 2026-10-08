// 探索面向的唯一來源（PRD §4.2）。面向名稱若調整，只改這裡與 courses.json。
// id 用於網址參數（PRD §6.6），name 為顯示名稱並與 courses.json 的 primaryTrack／relatedTracks 對應。
// visual 欄位是面向識別色的唯一來源；元件可直接套用這組 CSS token。
export const TRACKS = [
  {
    id: 'narrative',
    name: '敘事與創作',
    description: '散文、小說、詩歌、報導、文案、出版及跨媒介敘事',
    visual: {
      accent: '#8c4d3d',
      signal: '#eea08b',
      soft: '#f4e9e5',
      border: '#d8b6aa',
      onAccent: '#ffffff',
    },
  },
  {
    id: 'digital',
    name: '數位人文與媒介',
    description: '數位敘事、資料方法、AI 協作、互動媒介、空間人文及數位策展',
    visual: {
      accent: '#386a73',
      signal: '#83d6cd',
      soft: '#e6f0f0',
      border: '#a8c9cc',
      onAccent: '#ffffff',
    },
  },
  {
    id: 'culture',
    name: '文化與社會實踐',
    description: '地方創生、田野調查、文化資產、策展、品牌、節慶及社會議題實作',
    visual: {
      accent: '#76602d',
      signal: '#e9c579',
      soft: '#f2eedf',
      border: '#d4c69a',
      onAccent: '#ffffff',
    },
  },
] as const

export type Track = (typeof TRACKS)[number]
export type TrackId = Track['id']
export type TrackName = Track['name']

export const TRACK_NAMES: readonly TrackName[] = TRACKS.map((t) => t.name)

export const TRACKS_BY_ID: Readonly<Record<TrackId, Track>> = Object.fromEntries(
  TRACKS.map((track) => [track.id, track]),
) as Record<TrackId, Track>

export const TRACK_ID_BY_NAME: Readonly<Record<TrackName, TrackId>> = Object.fromEntries(
  TRACKS.map((track) => [track.name, track.id]),
) as Record<TrackName, TrackId>

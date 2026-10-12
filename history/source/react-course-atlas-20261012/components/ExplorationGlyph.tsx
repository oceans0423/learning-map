const paths = {
  foundation: 'M16 3 21 11 29 16 21 21 16 29 11 21 3 16 11 11Z M16 9 19 16 16 23 13 16Z',
  narrative: 'M7 26 12 14 25 5 28 8 19 22 7 26Z M7 26 20 13 M12 14 19 15 19 22',
  digital: 'M5 8H13V16H5Z M19 16H27V24H19Z M13 12H23V16 M9 16V24H19 M23 5V10 M20 7H26',
  culture: 'M3 25 11 9 18 20 23 13 29 25Z M8 15 11 18 14 15 M18 7H24 M21 4V10',
  integration: 'M16 3 19 12 29 16 19 20 16 29 12 20 3 16 12 12Z M25 3V9 M22 6H28',
} as const

export function ExplorationGlyph({ name }: { name: keyof typeof paths }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d={paths[name]}
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

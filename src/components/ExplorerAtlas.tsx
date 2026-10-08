const territories = [
  { id: 'narrative', name: '敘事與創作', note: '讓故事長出新的形狀', x: 170, y: 150 },
  { id: 'digital', name: '數位人文與媒介', note: '穿越人文與科技的邊界', x: 445, y: 215 },
  { id: 'culture', name: '文化與社會實踐', note: '在真實現場發現問題', x: 285, y: 385 },
] as const

const coastline =
  'M-105,-12 C-115,-62 -61,-90 -18,-79 C22,-108 94,-63 100,-20 C137,13 80,86 33,73 C-15,101 -94,65 -105,-12 Z'

/** Illustrated navigation; classification controls remain in StructureDiagram. */
export function ExplorerAtlas() {
  return (
    <div className="explorer-atlas" aria-label="探索地圖：前往三個人文探索面向">
      <div className="atlas-caption">
        <span>HUMANITIES / FIELD ATLAS</span>
        <span>NO. 115</span>
      </div>
      <svg className="atlas-terrain" viewBox="0 0 600 520" fill="none" aria-hidden="true">
        <defs>
          <pattern id="atlas-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" stroke="currentColor" strokeWidth=".5" />
            <circle cx="0" cy="0" r="1.3" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="600" height="520" fill="url(#atlas-grid)" className="atlas-grid" />
        <path
          d="M40 435C60 365 85 280 170 150S350 95 445 215S405 385 285 385S190 475 140 490"
          className="atlas-route"
        />
        {territories.map((territory) => (
          <g
            key={territory.id}
            className={`terrain-${territory.id}`}
            transform={`translate(${territory.x} ${territory.y})`}
          >
            <path d={coastline} fill="currentColor" opacity=".07" />
            {[1, 0.83, 0.66, 0.49, 0.32].map((scale) => (
              <path
                key={scale}
                d={coastline}
                transform={`scale(${scale})`}
                stroke="currentColor"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
                opacity=".4"
              />
            ))}
          </g>
        ))}
        <g transform="translate(540 62)" className="atlas-compass">
          <circle r="26" stroke="currentColor" opacity=".35" />
          <path d="M0-20 6 8 0 3-6 8Z" fill="currentColor" />
          <path d="M0 20-6-8 0-3 6-8Z" stroke="currentColor" />
          <text y="-33" textAnchor="middle" fill="currentColor" stroke="none" fontSize="10">
            N
          </text>
        </g>
      </svg>
      {territories.map((territory, index) => (
        <a
          className={`atlas-landmark landmark-${territory.id}`}
          href={`#track-${territory.id}`}
          key={territory.id}
        >
          <span className="landmark-pin" aria-hidden="true">
            <span />
          </span>
          <span className="landmark-label">
            <small>0{index + 1} / 探索領域</small>
            <strong>{territory.name}</strong>
            <span>
              {territory.note} <i aria-hidden="true">↗</i>
            </span>
          </span>
        </a>
      ))}
      <div className="atlas-origin">
        <span aria-hidden="true">＋</span> 你在這裡 · 從人文出發
      </div>
      <p className="atlas-footer">
        點選地標，探索你感興趣的方向 <span aria-hidden="true">↗</span>
      </p>
    </div>
  )
}

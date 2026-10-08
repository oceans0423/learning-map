import type { CSSProperties } from 'react'
import { FOCUS_OPTIONS, type FocusId } from '../config/focus'
import { ROLES_BY_ID } from '../config/roles'
import { TRACKS } from '../config/tracks'
import { ExplorationGlyph } from './ExplorationGlyph'

interface StructureDiagramProps {
  selected: readonly FocusId[]
  onToggle: (focus: FocusId) => void
}

export function StructureDiagram({ selected, onToggle }: StructureDiagramProps) {
  const foundation = FOCUS_OPTIONS.find((option) => option.id === 'foundation')!
  const integration = FOCUS_OPTIONS.find((option) => option.id === 'integration')!
  const trackOptions = FOCUS_OPTIONS.filter((option) => option.kind === 'track')

  return (
    <div className="structure-flow" aria-label="共同基底、探索面向與整合成果的互動結構">
      <button
        className="structure-node structure-control structure-foundation"
        style={{ '--focus-accent': ROLES_BY_ID.foundation.visual.signal } as CSSProperties}
        type="button"
        aria-pressed={selected.includes(foundation.id)}
        onClick={() => onToggle(foundation.id)}
      >
        <span className="node-step">01 / 基礎</span>
        <span className="node-symbol">
          <ExplorationGlyph name="foundation" />
        </span>
        <span className="structure-node-title">共同基底</span>
        <span className="structure-node-copy">文學文化與人文方法</span>
        <span className="node-action">
          {selected.includes(foundation.id) ? '已點亮 ✓' : '點亮相關課程 ↗'}
        </span>
      </button>
      <div className="structure-connector" aria-hidden="true">
        <span>延伸</span>
        <i />
      </div>
      <div className="structure-tracks" aria-label="三個探索面向">
        {TRACKS.map((track, index) => {
          const focus = trackOptions.find((option) => option.id === track.id)!
          return (
            <button
              className="structure-node structure-control track-node"
              id={`track-${track.id}`}
              key={track.id}
              style={
                {
                  '--focus-accent': track.visual.signal,
                  '--track-soft': track.visual.soft,
                } as CSSProperties
              }
              type="button"
              aria-pressed={selected.includes(focus.id)}
              onClick={() => onToggle(focus.id)}
            >
              <span className="node-step">0{index + 2} / 探索</span>
              <span className="node-symbol">
                <ExplorationGlyph name={track.id} />
              </span>
              <span className="structure-node-title">{track.name}</span>
              <span className="structure-node-copy">{track.description}</span>
              <span className="node-action">
                {selected.includes(focus.id) ? '已點亮 ✓' : '點亮相關課程 ↗'}
              </span>
            </button>
          )
        })}
      </div>
      <div className="structure-connector" aria-hidden="true">
        <span>交會</span>
        <i />
      </div>
      <button
        className="structure-node structure-control structure-integration"
        style={{ '--focus-accent': ROLES_BY_ID.integration.visual.signal } as CSSProperties}
        type="button"
        aria-pressed={selected.includes(integration.id)}
        onClick={() => onToggle(integration.id)}
      >
        <span className="node-step">05 / 實踐</span>
        <span className="node-symbol">
          <ExplorationGlyph name="integration" />
        </span>
        <span className="structure-node-title">整合成果</span>
        <span className="structure-node-copy">專題、實習與畢業製作</span>
        <span className="node-action">
          {selected.includes(integration.id) ? '已點亮 ✓' : '點亮相關課程 ↗'}
        </span>
      </button>
    </div>
  )
}

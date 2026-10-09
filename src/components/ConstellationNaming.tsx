import { useEffect, useRef, useState } from 'react'
import type { PersonalAction, PersonalState } from '../lib/personal'
import { boundedName, graphemes } from '../lib/constellation'
import { Button } from './Button'
import { ConstellationArt } from './ConstellationArt'
interface Props {
  state: PersonalState
  dispatch: (action: PersonalAction) => void
}
export function ConstellationNaming({ state, dispatch }: Props) {
  const [draft, setDraft] = useState(state.name === '未命名星座' ? '' : state.name)
  const [celebrating, setCelebrating] = useState(false)
  const composing = useRef(false)
  useEffect(() => {
    if (!celebrating) return
    const timer = window.setTimeout(() => setCelebrating(false), 480)
    return () => window.clearTimeout(timer)
  }, [celebrating])
  const count = graphemes(draft).length
  return (
    <section className="constellation-naming" aria-label="星座命名">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (composing.current) return
          const name = boundedName(draft)
          setCelebrating(!!name && !state.namedOnce && !!state.representatives.length)
          dispatch({ type: 'name', value: draft })
          setDraft(name)
        }}
      >
        <label htmlFor="constellation-name">為你的星座命名</label>
        <div className="constellation-name-controls">
          <input
            id="constellation-name"
            value={draft}
            placeholder="例如：故事與地方的交會"
            aria-describedby="constellation-name-limit"
            onCompositionStart={() => {
              composing.current = true
            }}
            onCompositionEnd={() => {
              composing.current = false
            }}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Button type="submit" variant="primary" disabled={!state.representatives.length}>
            {state.completed ? '更新名稱' : '完成這個星座'}
          </Button>
        </div>
        <p id="constellation-name-limit">
          {count}／24 個文字或 emoji 組合
          {count > 24 ? '；提交時保留前24個。' : '；空白會使用「未命名星座」。'}
          {!state.representatives.length && '先選至少一顆代表星。'}
        </p>
      </form>
      {state.representatives.length > 0 && (
        <ConstellationArt
          stars={state.representatives}
          name={state.name}
          celebrating={celebrating}
          onMove={(id, point) => dispatch({ type: 'move', id, ...point })}
        />
      )}
      {state.completed && (
        <p role="status">
          這是你的個人探索星座。可以改名、調整代表星，或繼續探索課程；不代表已修課或官方推薦。
        </p>
      )}
    </section>
  )
}

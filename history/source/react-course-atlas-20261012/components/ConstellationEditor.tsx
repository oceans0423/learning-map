import { useEffect, useRef, useState } from 'react'
import { courses } from '../data/courses'
import type { PersonalAction, PersonalState } from '../lib/personal'
import { Button } from './Button'
import { ConstellationNaming } from './ConstellationNaming'
interface Props {
  state: PersonalState
  dispatch: (action: PersonalAction) => void
  onReturn: () => void
}
export function ConstellationEditor({ state, dispatch, onReturn }: Props) {
  const [candidate, setCandidate] = useState<string | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const replacementHeading = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    heading.current?.focus()
  }, [])
  useEffect(() => {
    if (candidate) replacementHeading.current?.focus({ preventScroll: true })
  }, [candidate])
  const name = (id: string) => courses.find((course) => course.id === id)!.name
  return (
    <section className="constellation-editor" aria-label="個人星座編輯器">
      <h3 ref={heading} tabIndex={-1}>
        選擇你的代表星
      </h3>
      <Button onClick={onReturn}>繼續探索課程</Button>
      {!state.ids.length ? (
        <p>先收藏感興趣的課程，再選擇代表星；也可以直接返回找課，不需要建立星座。</p>
      ) : (
        <>
          <p className="representative-count" role="status">
            代表星 {state.representatives.length}／8 · 收藏 {state.ids.length} 門
          </p>
          <p>八顆是構圖的代表星上限，不是收藏上限。選一顆也可以；移除代表星不會取消收藏。</p>
          <ConstellationNaming state={state} dispatch={dispatch} />
          {!state.undo && state.message && <p role="status">{state.message}</p>}
          {candidate && (
            <section className="replacement-panel" aria-label="替換代表星">
              <h4 ref={replacementHeading} tabIndex={-1}>
                代表星已達八顆
              </h4>
              <p>要加入「{name(candidate)}」，請選一顆明確替換；取消會保持原作品。</p>
              <div>
                {state.representatives.map((star) => (
                  <Button
                    key={star.id}
                    onClick={() => {
                      dispatch({ type: 'replace', oldId: star.id, newId: candidate })
                      setCandidate(null)
                    }}
                  >
                    替換「{name(star.id)}」
                  </Button>
                ))}
              </div>
              <Button onClick={() => setCandidate(null)}>取消替換</Button>
            </section>
          )}
          <details className="representative-picker" open={!state.completed}>
            <summary>調整代表星（{state.representatives.length}／8）</summary>
            <div className="representative-options" role="group" aria-label="代表星選擇">
              {state.ids.map((id) => {
                const chosen = state.representatives.some((star) => star.id === id)
                return (
                  <Button
                    key={id}
                    data-representative-id={id}
                    aria-pressed={chosen}
                    aria-label={`${chosen ? '移除代表星' : '選為代表星'}：${name(id)}`}
                    onClick={() => {
                      if (!chosen && state.representatives.length >= 8) setCandidate(id)
                      else dispatch({ type: 'representative', id })
                    }}
                  >
                    {chosen ? '✓ ' : '＋ '}
                    {name(id)}
                  </Button>
                )
              })}
            </div>
          </details>
        </>
      )}
    </section>
  )
}

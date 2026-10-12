import { useRef, useState, type ReactNode } from 'react'
import { Button } from './Button'
import { meta } from '../data/courses'
import '../styles/course-atlas.css'

interface Props {
  query: string
  onSearch: (query: string) => void
  onMap: () => void
  onMine: () => void
  count: number
  mine: boolean
  children: ReactNode
}

export function CourseAtlasShell({
  query,
  onSearch,
  onMap,
  onMine,
  count,
  mine,
  children,
}: Props) {
  const [input, setInput] = useState(query)
  const [previousQuery, setPreviousQuery] = useState(query)
  if (query !== previousQuery) {
    setPreviousQuery(query)
    setInput(query)
  }
  const composing = useRef(false)
  return (
    <div className="course-atlas">
      <a className="atlas-skip" href="#atlas-content">
        跳至課程內容
      </a>
      <header className="ca-header ca-container">
        <button className="ca-brand" type="button" onClick={onMap}>
          <span className="ca-brand-mark" aria-hidden="true">
            ✦
          </span>
          <span>
            {meta.department}
            <small>THE COURSE ATLAS</small>
          </span>
        </button>
        <nav aria-label="主要導覽">
          <Button onClick={onMap} aria-current={!mine ? 'page' : undefined}>
            課程地圖
          </Button>
          <Button
            id="atlas-mine-entry"
            onClick={onMine}
            aria-current={mine ? 'page' : undefined}
          >
            我的課程{count > 0 ? `（${count}）` : ''}
          </Button>
        </nav>
      </header>
      <main className="ca-container">
        <section className="ca-intro" aria-labelledby="atlas-title">
          <p className="ca-eyebrow">{meta.sourceVersion} · 大學部規劃課程</p>
          <h1 id="atlas-title">
            課程地圖<span aria-hidden="true"> / </span>
            <small>從這裡，找到你的方向。</small>
          </h1>
          <p>看懂四大領域與四年課程，從感興趣的地方開始。收藏與星座都是選用。</p>
        </section>
        <form
          className="ca-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault()
            if (!composing.current) onSearch(input.trim())
          }}
        >
          <label htmlFor="atlas-search">搜尋所有課程</label>
          <div className="ca-search-row">
            <input
              id="atlas-search"
              type="search"
              value={input}
              placeholder="輸入課程名稱，例如：敘事、文化、數位"
              maxLength={120}
              onChange={(event) => setInput(event.target.value)}
              onCompositionStart={() => {
                composing.current = true
              }}
              onCompositionEnd={(event) => {
                composing.current = false
                setInput(event.currentTarget.value)
              }}
            />
            <Button type="submit" variant="primary">
              搜尋
            </Button>
            {(query || input) && (
              <Button
                onClick={() => {
                  setInput('')
                  onSearch('')
                }}
              >
                清除搜尋
              </Button>
            )}
          </div>
        </form>
        {children}
      </main>
      <footer className="ca-footer ca-container">
        <p>
          {meta.sourceVersion} · 共 {meta.totalCourses} 門規劃課程，必修 {meta.required}{' '}
          門、選修 {meta.elective} 門。
        </p>
        <p>實際開課依當學年度課表。圖像位置與裝飾線不代表先修或修課順序。</p>
      </footer>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { courses } from '../data/courses'
import type { Course } from '../types/course'
import { searchCourses } from '../lib/search'
import { assignScorpiusCourses, SCORPIUS_EDGES, SCORPIUS_POINTS } from '../lib/scorpius'
import { CourseDetailsDialog } from './CourseDetailsDialog'
import { Button } from './Button'
import '../styles/scorpius.css'

interface ScorpiusPrototypeProps {
  ids: string[]
  message: string
  saved: boolean
  storageMessage: string
  undoId: string | null
  onUndo: () => void
  onToggle: (id: string) => void
  onReturn: () => void
  onCourse: (id: string, source?: HTMLElement) => void
  activeCourse: Course | null
  onCloseCourse: () => void
  sourceElement: HTMLElement | null
}

const PAGE_SIZE = 8
const yearName = (year: number) => ['大一', '大二', '大三', '大四'][year - 1]

export function ScorpiusPrototype({
  ids,
  message,
  saved,
  storageMessage,
  undoId,
  onUndo,
  onToggle,
  onReturn,
  onCourse,
  activeCourse,
  onCloseCourse,
  sourceElement,
}: ScorpiusPrototypeProps) {
  const [query, setQuery] = useState('')
  const [year, setYear] = useState('all')
  const [onlySelected, setOnlySelected] = useState(false)
  const [page, setPage] = useState(0)
  const [choosing, setChoosing] = useState(ids.length === 0)
  const [group, setGroup] = useState<number | null>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const pickerTitleRef = useRef<HTMLHeadingElement>(null)
  const selectedTitleRef = useRef<HTMLHeadingElement>(null)
  const groupRef = useRef<HTMLDialogElement>(null)
  const starRefs = useRef(new Map<number, HTMLButtonElement>())
  const slots = assignScorpiusCourses(ids, courses)
  const selected = slots.flatMap((slot) => slot.courses)
  const filtered = searchCourses(courses, query).filter(
    (course) =>
      (year === 'all' || course.year === Number(year)) &&
      (!onlySelected || ids.includes(course.id)),
  )
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages - 1)
  const shown = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE)
  const grouped = group === null ? null : slots[group]

  useEffect(() => {
    if (group === null || activeCourse) return
    const dialog = groupRef.current
    const source = starRefs.current.get(group)
    dialog?.showModal()
    return () => {
      dialog?.close()
      source?.focus({ preventScroll: true })
    }
  }, [group, activeCourse])

  function chooseCourses() {
    setChoosing(true)
    requestAnimationFrame(() => pickerTitleRef.current?.focus())
  }

  function viewConstellation() {
    setChoosing(false)
    requestAnimationFrame(() => titleRef.current?.focus())
  }

  function toggleCourse(id: string) {
    onToggle(id)
    // A selected-only list may remove the focused button; return to a stable heading.
    requestAnimationFrame(() => {
      if (document.activeElement === document.body)
        (choosing ? pickerTitleRef : selectedTitleRef).current?.focus({ preventScroll: true })
    })
  }

  function changePage(next: number) {
    setPage(next)
    requestAnimationFrame(() => pickerTitleRef.current?.focus())
  }

  return (
    <div className="workbench scorpius-prototype">
      <a className="skip-link" href="#scorpius-chart-title">
        跳至我的星座
      </a>
      <header className="scorpius-header">
        <Button onClick={onReturn}>← 回到課程地圖</Button>
        <span>
          <span className="scorpius-department">人文跨域與應用學系 </span>
          <span className="scorpius-header-tag">單款原型</span>
        </span>
      </header>
      <main className="scorpius-main">
        <section className="scorpius-intro" aria-labelledby="scorpius-title">
          <div>
            <p className="scorpius-eyebrow">MY COURSE CONSTELLATION</p>
            <h1 id="scorpius-title" tabIndex={-1}>
              讓你的選擇，<span>連成一座星座。</span>
            </h1>
            <p>選擇感興趣的課程，自動組成天蠍座。不用畫線，也不用調整位置。</p>
          </div>
          <Button variant="primary" onClick={chooseCourses}>
            {ids.length ? '調整選擇的課程' : '選擇課程'}
          </Button>
        </section>

        <div className={`scorpius-layout${choosing ? ' is-choosing' : ''}`}>
          <section
            className="scorpius-stage"
            aria-labelledby="scorpius-chart-title"
            style={{
              backgroundImage: `linear-gradient(#10182722, #10182722), url("${import.meta.env.BASE_URL}images/backgrounds/minimal-deep-blue-starfield.png")`,
            }}
          >
            <header className="scorpius-stage-header">
              <div>
                <p className="scorpius-eyebrow">SCORPIUS / 固定點線模板</p>
                <h2 id="scorpius-chart-title" ref={titleRef} tabIndex={-1}>
                  我的天蠍座
                </h2>
              </div>
              <span className="scorpius-count">{selected.length} 門課程</span>
            </header>
            <div className="scorpius-chart" aria-label="天蠍座課程星圖">
              <svg className="scorpius-lines" viewBox="0 0 1000 1250" aria-hidden="true">
                {SCORPIUS_EDGES.map(([a, b]) => (
                  <line
                    key={`${a}-${b}`}
                    x1={SCORPIUS_POINTS[a].x * 1000}
                    y1={SCORPIUS_POINTS[a].y * 1250}
                    x2={SCORPIUS_POINTS[b].x * 1000}
                    y2={SCORPIUS_POINTS[b].y * 1250}
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                {slots
                  .filter((slot) => !slot.courses.length)
                  .map((slot) => (
                    <circle key={slot.index} cx={slot.x * 1000} cy={slot.y * 1250} r="5" />
                  ))}
              </svg>
              {slots
                .filter((slot) => slot.courses.length)
                .map((slot) => (
                  <button
                    type="button"
                    className="scorpius-star"
                    key={slot.index}
                    ref={(node) => {
                      if (node) starRefs.current.set(slot.index, node)
                      else starRefs.current.delete(slot.index)
                    }}
                    style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%` }}
                    data-scorpius-slot={slot.index}
                    aria-label={`星點 ${slot.index + 1}，${slot.courses.length} 門課程：${slot.courses.map((course) => course.name).join('、')}`}
                    onClick={() => {
                      if (slot.courses.length === 1) onCourse(slot.courses[0].id)
                      else setGroup(slot.index)
                    }}
                  >
                    <span className="scorpius-star-core" aria-hidden="true" />
                    <span className="scorpius-star-number" aria-hidden="true">
                      {String(slot.index + 1).padStart(2, '0')}
                    </span>
                    {slot.courses.length > 1 && (
                      <span className="scorpius-star-badge" aria-hidden="true">
                        {slot.courses.length}
                      </span>
                    )}
                  </button>
                ))}
            </div>
            <div className="scorpius-stage-caption">
              <p>
                {selected.length
                  ? '點亮的星點可以查看課程；編號對應下方清單。'
                  : '先選一門感興趣的課程，點亮你的第一顆星。'}
              </p>
              <p className="scorpius-muted">
                細線與暗點是固定造型，不是待完成任務、先修順序或人格測驗。
              </p>
            </div>
          </section>

          {choosing && (
            <section
              className="scorpius-picker scorpius-panel"
              aria-labelledby="scorpius-picker-title"
            >
              <header className="scorpius-panel-header">
                <h2 id="scorpius-picker-title" ref={pickerTitleRef} tabIndex={-1}>
                  選擇課程
                </h2>
                <Button
                  variant="primary"
                  onClick={viewConstellation}
                  disabled={!selected.length}
                >
                  看我的星座 · {selected.length} 門
                </Button>
              </header>
              <p className="scorpius-muted">
                沿用目前收藏。增加課程會自動排列，不限制為十一門。
              </p>
              <label className="scorpius-field">
                搜尋課名
                <input
                  type="search"
                  value={query}
                  placeholder="例如：敘事、AI、文化"
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setPage(0)
                  }}
                />
              </label>
              <div className="scorpius-picker-filters">
                <label className="scorpius-field">
                  年級
                  <select
                    value={year}
                    onChange={(event) => {
                      setYear(event.target.value)
                      setPage(0)
                    }}
                  >
                    <option value="all">全部年級</option>
                    {[1, 2, 3, 4].map((value) => (
                      <option key={value} value={value}>
                        {yearName(value)}
                      </option>
                    ))}
                  </select>
                </label>
                <Button
                  aria-pressed={onlySelected}
                  onClick={() => {
                    setOnlySelected(!onlySelected)
                    setPage(0)
                  }}
                >
                  只看已選
                </Button>
              </div>
              <p className="scorpius-muted" role="status">
                找到 {filtered.length} 門課程 · 已選 {selected.length} 門
              </p>
              <ul className="scorpius-options">
                {shown.map((course) => (
                  <li key={course.id}>
                    <div>
                      <button
                        type="button"
                        className="scorpius-course-name"
                        onClick={() => onCourse(course.id)}
                      >
                        {course.name}
                      </button>
                      <p>
                        {yearName(course.year)}
                        {course.semester === 1 ? '上' : '下'} ·{' '}
                        {course.type === 'required' ? '必修' : '選修'} · {course.credits} 學分
                      </p>
                    </div>
                    <Button
                      aria-pressed={ids.includes(course.id)}
                      data-scorpius-select={course.id}
                      aria-label={`${ids.includes(course.id) ? '取消選擇' : '選擇'}：${course.name}`}
                      onClick={() => toggleCourse(course.id)}
                    >
                      {ids.includes(course.id) ? '✓ 已選' : '＋ 選擇'}
                    </Button>
                  </li>
                ))}
              </ul>
              {!filtered.length && <p>沒有符合的課程。</p>}
              {(query || year !== 'all' || onlySelected) && (
                <Button
                  onClick={() => {
                    setQuery('')
                    setYear('all')
                    setOnlySelected(false)
                    setPage(0)
                  }}
                >
                  清除篩選（保留已選課程）
                </Button>
              )}
              <nav className="scorpius-pagination" aria-label="課程選擇分頁">
                <Button
                  disabled={currentPage === 0}
                  onClick={() => changePage(currentPage - 1)}
                >
                  上一頁
                </Button>
                <span>
                  第 {currentPage + 1}／{pages} 頁
                </span>
                <Button
                  disabled={currentPage === pages - 1}
                  onClick={() => changePage(currentPage + 1)}
                >
                  下一頁
                </Button>
              </nav>
            </section>
          )}
        </div>

        <section
          className="scorpius-selected scorpius-panel"
          aria-labelledby="scorpius-selected-title"
        >
          <header className="scorpius-panel-header">
            <h2 id="scorpius-selected-title" ref={selectedTitleRef} tabIndex={-1}>
              我的課程 · {selected.length} 門
            </h2>
            <Button onClick={chooseCourses}>選擇更多課程</Button>
          </header>
          <p className="scorpius-muted">
            {selected.length > 11
              ? '超過十一門時，同一星點包含多門課程。點星點可展開，這裡始終列出全部課程。'
              : '每門課程自動落在固定星點；星座造型不影響課程的正式分類。'}
          </p>
          {!selected.length && <p>還沒有選擇課程。不做星座也可以返回課程地圖，繼續找課。</p>}
          <ol className="scorpius-selected-list">
            {slots.flatMap((slot) =>
              slot.courses.map((course) => (
                <li key={course.id} data-scorpius-course={course.id}>
                  <span className="scorpius-list-number">
                    {String(slot.index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <button
                      type="button"
                      className="scorpius-course-name"
                      onClick={() => onCourse(course.id)}
                    >
                      {course.name}
                    </button>
                    <p>
                      {yearName(course.year)}
                      {course.semester === 1 ? '上' : '下'} · {course.module}
                    </p>
                  </div>
                  <Button
                    aria-label={`移除：${course.name}`}
                    onClick={() => toggleCourse(course.id)}
                  >
                    移除
                  </Button>
                </li>
              )),
            )}
          </ol>
          <p className="scorpius-feedback" role="status">
            {message}
          </p>
          {undoId && <Button onClick={onUndo}>復原最近移除的課程</Button>}
        </section>
        <footer className="scorpius-footer">
          <p>
            {saved
              ? '沿用你已同意的本機收藏保存設定。'
              : '目前是本次瀏覽的收藏草稿；未新增保存同意，重載可能失去選擇。'}
          </p>
          {storageMessage && <p role="status">{storageMessage}</p>}
          <p>
            這是藝術化天蠍座模板，不是精確天文星位、官方修課安排或已修課紀錄。實際開課以當學年度課表為準。
          </p>
        </footer>
      </main>

      {grouped && !activeCourse && (
        <dialog
          className="scorpius-group"
          ref={groupRef}
          aria-labelledby="scorpius-group-title"
          onCancel={(event) => {
            event.preventDefault()
            setGroup(null)
          }}
        >
          <header className="scorpius-panel-header">
            <h2 id="scorpius-group-title">
              星點 {grouped.index + 1} · {grouped.courses.length} 門課程
            </h2>
            <Button autoFocus onClick={() => setGroup(null)}>
              關閉星點清單
            </Button>
          </header>
          <p>選擇一門課程查看正式資訊。</p>
          <ul>
            {grouped.courses.map((course) => (
              <li key={course.id}>
                <button
                  type="button"
                  className="scorpius-course-name"
                  onClick={() => {
                    // Open from a stable star, not a button about to disappear with this dialog.
                    setGroup(null)
                    onCourse(course.id, starRefs.current.get(grouped.index))
                  }}
                >
                  {course.name}
                </button>
              </li>
            ))}
          </ul>
        </dialog>
      )}
      {activeCourse && (
        <CourseDetailsDialog
          course={activeCourse}
          onClose={onCloseCourse}
          sourceElement={sourceElement}
          collected={ids.includes(activeCourse.id)}
          onToggleCollection={() => onToggle(activeCourse.id)}
          collectionMessage={message}
        />
      )}
    </div>
  )
}

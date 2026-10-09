import { useEffect, useReducer, useRef, useState } from 'react'
import { courses, meta } from '../data/courses'
import { LEARNING_PATH } from '../data/learningPath'
import { SIGNALS, type SignalId } from '../config/explorationSignals'
import { type FocusId } from '../config/focus'
import { SemesterAtlas } from './SemesterAtlas'
import { StructureDiagram } from './StructureDiagram'
import { CourseDetailsDialog } from './CourseDetailsDialog'
import { Button } from './Button'
import { CourseSearch } from './CourseSearch'
import { CollectionPanel } from './CollectionPanel'
import { personalReducer } from '../lib/personal'
import { ConstellationEditor } from './ConstellationEditor'
import { loadPersonal } from '../lib/personalStorage'
import { usePersonalStorage } from '../lib/usePersonalStorage'
import { PersonalStorageControls } from './PersonalStorageControls'
import { searchCourses } from '../lib/search'
import { closeCourseUrlState, pushCourseUrlState, replaceUrlState } from '../lib/urlState'
import { parseAtlasState } from '../lib/atlas'
import { useCollectionFlight } from '../lib/useCollectionFlight'
import { ScorpiusPrototype } from './ScorpiusPrototype'
import '../styles/workbench.css'
import '../styles/motion.css'
import '../styles/collection.css'
import '../styles/constellation.css'

export function WorkbenchApp() {
  const [mapState, setMapState] = useState(() => parseAtlasState(window.location.search))
  const visitedSemesters = useRef(new Map<number, 1 | 2>())
  const [view, setView] = useState<
    'map' | 'list' | 'collection' | 'constellation' | 'scorpius'
  >(() => (window.location.hash.startsWith('#scorpius') ? 'scorpius' : 'map'))
  const [loadedPersonal] = useState(loadPersonal)
  const [collection, dispatchCollection] = useReducer(personalReducer, loadedPersonal.state)
  const storage = usePersonalStorage(collection, loadedPersonal)
  const { fly, cancel: cancelFlight } = useCollectionFlight()
  useEffect(() => {
    cancelFlight()
  }, [view, cancelFlight])
  const [query, setQuery] = useState('')
  const [locateRevision, setLocateRevision] = useState(0)
  const [noteSource, setNoteSource] = useState<HTMLElement | null>(null)
  const pendingClose = useRef<ReturnType<typeof parseAtlasState> | null>(null)
  useEffect(() => {
    const sync = () => {
      cancelFlight()
      const next = pendingClose.current ?? parseAtlasState(window.location.search)
      if (pendingClose.current) {
        pendingClose.current = null
        replaceUrlState(next)
      }
      setMapState(next)
      if (!next.courseId) setNoteSource(null)
    }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [cancelFlight])
  const activeCourse = courses.find((course) => course.id === mapState.courseId) ?? null
  function chooseYear(year: number | null) {
    cancelFlight()
    if (mapState.atlasYear && mapState.semester !== 'all')
      visitedSemesters.current.set(mapState.atlasYear, mapState.semester)
    const next = {
      ...mapState,
      atlasYear: year,
      openYears: year ? [year] : mapState.openYears,
      semester: year ? (visitedSemesters.current.get(year) ?? 1) : mapState.semester,
    }
    replaceUrlState(next)
    setMapState(next)
  }
  function chooseSemester(semester: 1 | 2) {
    cancelFlight()
    if (mapState.atlasYear) visitedSemesters.current.set(mapState.atlasYear, semester)
    const next = { ...mapState, semester }
    replaceUrlState(next)
    setMapState(next)
  }
  function toggleFocus(focus: FocusId) {
    const next = {
      ...mapState,
      focus: mapState.focus.includes(focus)
        ? mapState.focus.filter((f) => f !== focus)
        : [...mapState.focus, focus],
    }
    replaceUrlState(next)
    setMapState(next)
  }
  function openCourse(id: string, source?: HTMLElement) {
    cancelFlight()
    setNoteSource(
      source ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null),
    )
    pushCourseUrlState(mapState, id)
    setMapState((current) => ({ ...current, courseId: id }))
  }
  function locateCourse(id: string) {
    cancelFlight()
    setNoteSource(document.activeElement instanceof HTMLElement ? document.activeElement : null)
    const course = courses.find((course) => course.id === id)!
    const next = {
      ...mapState,
      atlasYear: course.year,
      openYears: [course.year],
      semester: course.semester,
    }
    pushCourseUrlState(next, id)
    setMapState({ ...next, courseId: id })
    setLocateRevision((value) => value + 1)
  }
  function toggleSignal(id: SignalId) {
    const next = {
      ...mapState,
      signals: mapState.signals.includes(id)
        ? mapState.signals.filter((signal) => signal !== id)
        : [...mapState.signals, id],
    }
    replaceUrlState(next)
    setMapState(next)
  }
  function clearSignals() {
    const next = { ...mapState, signals: [] }
    replaceUrlState(next)
    setMapState(next)
  }
  function closeCourse() {
    cancelFlight()
    const next = { ...mapState, courseId: null }
    if (closeCourseUrlState(mapState) === 'replaced') {
      setMapState(next)
      setNoteSource(null)
    } else pendingClose.current = next
  }
  function toggleCollection(id: string) {
    const adding = !collection.ids.includes(id)
    const trigger =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    dispatchCollection({ type: adding ? 'add' : 'remove', id })
    fly(id, adding, trigger)
  }
  function enterConstellation() {
    cancelFlight()
    const next = { ...mapState, courseId: null }
    replaceUrlState(next)
    setMapState(next)
    dispatchCollection({ type: 'initialize' })
    setView('constellation')
  }
  function enterScorpius() {
    cancelFlight()
    const url = new URL(window.location.href)
    url.hash = 'scorpius'
    window.history.replaceState(window.history.state, '', url)
    const next = { ...mapState, courseId: null }
    replaceUrlState(next)
    setMapState(next)
    setNoteSource(null)
    setView('scorpius')
    window.scrollTo({ top: 0, behavior: 'instant' })
    requestAnimationFrame(() =>
      document.getElementById('scorpius-title')?.focus({ preventScroll: true }),
    )
  }
  function leaveScorpius() {
    cancelFlight()
    const url = new URL(window.location.href)
    url.hash = ''
    window.history.replaceState(window.history.state, '', url)
    const next = { ...mapState, courseId: null }
    replaceUrlState(next)
    setMapState(next)
    setView('map')
    requestAnimationFrame(() => document.querySelector<HTMLElement>('.scorpius-entry')?.focus())
  }
  if (view === 'scorpius') {
    return (
      <ScorpiusPrototype
        ids={collection.ids}
        message={collection.message}
        saved={storage.enabled}
        storageMessage={storage.message}
        undoId={collection.undo?.id ?? null}
        onUndo={() => dispatchCollection({ type: 'undo' })}
        onToggle={(id) =>
          dispatchCollection({ type: collection.ids.includes(id) ? 'remove' : 'add', id })
        }
        onReturn={leaveScorpius}
        onCourse={openCourse}
        activeCourse={activeCourse}
        onCloseCourse={closeCourse}
        sourceElement={noteSource}
      />
    )
  }
  return (
    <div className="workbench">
      <a className="skip-link" href="#curriculum">
        跳至課程地圖
      </a>
      <header className="wb-header">
        <a href="#top">✦ 人文跨域與應用學系</a>
        <span>115 學年度 · 課程探索</span>
        <Button className="scorpius-entry" onClick={enterScorpius}>
          天蠍座原型
        </Button>
      </header>
      <main id="top" className="wb-main">
        <section className="wb-intro" aria-labelledby="page-title">
          <p className="wb-kicker">THE HUMANITIES ATLAS / 69 個探索的起點</p>
          <h1 id="page-title">
            從一個提問，<span>找到你的下一門課。</span>
          </h1>
          <p>先選年級，再點課名查看筆記；也可以直接使用所有課程清單。不收藏也能完整探索。</p>
        </section>
        <section className="wb-signals" aria-label="探索訊號草案">
          <p>
            選擇你感興趣的方向，看看哪些課程相關。<small>探索導覽草案，非官方分流</small>
          </p>
          <div className="wb-signal-guide">
            {SIGNALS.map((signal) => (
              <Button
                className="wb-signal-button"
                key={signal.id}
                data-signal={signal.id}
                aria-pressed={mapState.signals.includes(signal.id)}
                onClick={() => toggleSignal(signal.id)}
                aria-label={signal.label}
              >
                <span className="wb-signal-check" aria-hidden="true">
                  {mapState.signals.includes(signal.id) ? '✓' : '＋'}
                </span>
                <strong>{signal.label}</strong>
                <span>{signal.question}</span>
              </Button>
            ))}
          </div>
          <Button onClick={clearSignals}>清除訊號</Button>
        </section>
        <nav className="wb-toolbar" aria-label="探索工作台">
          <div className="wb-toolbar-main">
            <Button
              variant="toggle"
              aria-pressed={view === 'map'}
              onClick={() => setView('map')}
            >
              課程星圖
            </Button>
            <Button
              variant="toggle"
              aria-pressed={view === 'list'}
              onClick={() => setView('list')}
            >
              所有課程
            </Button>
            <Button className="constellation-entry" onClick={enterConstellation}>
              我的星座（選用）
            </Button>
          </div>
          <div className="wb-personal-slot">
            {collection.ids.length > 0 && (
              <>
                <span className="collection-summary-text">
                  我的探索 {collection.ids.length} 門
                </span>
                <Button
                  className="collection-summary"
                  aria-label={`查看收藏，${collection.ids.length} 門課程`}
                  onClick={() => setView('collection')}
                >
                  查看收藏{' '}
                  <span className="collection-mobile-count">{collection.ids.length}</span>
                </Button>
              </>
            )}
          </div>
        </nav>
        {(view !== 'constellation' || collection.undo) && (
          <div className="wb-feedback">
            <p role="status">{collection.message}</p>
            {collection.undo && (
              <Button onClick={() => dispatchCollection({ type: 'undo' })}>
                復原「{courses.find((course) => course.id === collection.undo!.id)!.name}」
              </Button>
            )}
          </div>
        )}
        <CourseSearch
          courses={courses}
          query={query}
          onQuery={setQuery}
          showResults={view === 'map'}
          onCourse={(course) => locateCourse(course.id)}
          onAll={() => setView('list')}
        />
        <div className={`wb-columns${view === 'constellation' ? ' is-editing' : ''}`}>
          <section
            id="curriculum"
            className="wb-map"
            aria-labelledby="curriculum-title"
            tabIndex={-1}
          >
            <h2 id="curriculum-title">
              {view === 'map'
                ? '四年課程地圖'
                : view === 'list'
                  ? '所有課程 · 69 門'
                  : view === 'constellation'
                    ? '我的星座'
                    : `我的探索 · ${collection.ids.length} 門`}
            </h2>
            {view === 'map' ? (
              <SemesterAtlas
                key={locateRevision}
                courses={courses}
                year={mapState.atlasYear}
                semester={mapState.semester === 2 ? 2 : 1}
                focus={mapState.focus}
                signals={mapState.signals}
                activeId={mapState.courseId}
                onYear={chooseYear}
                onSemester={chooseSemester}
                onCourse={(course) => openCourse(course.id)}
              />
            ) : view === 'collection' ? (
              <>
                <CollectionPanel
                  ids={collection.ids}
                  onRemove={(id) => dispatchCollection({ type: 'remove', id })}
                  onCourse={openCourse}
                  onReturn={() => setView('map')}
                  onCreate={enterConstellation}
                />
                {collection.ids.length > 0 && <PersonalStorageControls {...storage} />}
              </>
            ) : view === 'constellation' ? (
              <>
                <ConstellationEditor
                  state={collection}
                  dispatch={dispatchCollection}
                  onReturn={() => setView('map')}
                />
                {(collection.ids.length > 0 || storage.message) && (
                  <PersonalStorageControls {...storage} />
                )}
              </>
            ) : (
              <ul className="wb-course-list">
                {searchCourses(courses, query).map((course) => (
                  <li key={course.id}>
                    <Button data-list-id={course.id} onClick={() => openCourse(course.id)}>
                      {course.name}
                    </Button>
                    <span>
                      大{['一', '二', '三', '四'][course.year - 1]} ·{' '}
                      {course.semester === 1 ? '上' : '下'}學期 ·{' '}
                      {course.type === 'required' ? '必修' : '選修'} · {course.credits} 學分
                    </span>
                  </li>
                ))}
                {searchCourses(courses, query).length === 0 && (
                  <li>沒有符合的課程。請使用上方「清除搜尋」查看全部。</li>
                )}
              </ul>
            )}
          </section>
          <aside className="wb-note-slot" aria-label="課程筆記區">
            {activeCourse && view !== 'constellation' ? (
              <CourseDetailsDialog
                course={activeCourse}
                onClose={closeCourse}
                responsive
                sourceElement={noteSource}
                collected={collection.ids.includes(activeCourse.id)}
                collectionMessage={collection.message}
                onToggleCollection={() => toggleCollection(activeCourse.id)}
              />
            ) : (
              <div className="wb-note-intro ui-paper">
                <p className="wb-kicker">FIELD NOTES / 課程筆記</p>
                <h2>
                  每一門課，
                  <br />
                  都是一個入口。
                </h2>
                <p>點選課名，讀取年級、學期、學分及正式課程資訊。</p>
                <p>先認識課程，不必先做任何收藏。</p>
                <hr />
                <p>
                  69 門規劃課程
                  <br />
                  15 門必修 · 54 門選修
                </p>
                <small>實際開課以當學年度課表為準。</small>
              </div>
            )}
          </aside>
        </div>
        <details className="wb-supplement">
          <summary>了解四年主線與正式探索面向</summary>
          <p>從共同的人文基礎，延伸到不同探索方向，再於專題與實作交會；沒有固定分流。</p>
          <StructureDiagram selected={mapState.focus} onToggle={toggleFocus} />
          <p>此處沿用原本正式面向高亮，與四個新探索訊號分開。</p>
          <ol className="wb-learning">
            {LEARNING_PATH.map((year) => (
              <li key={year.year}>
                <h3>
                  大{['一', '二', '三', '四'][year.year - 1]} · {year.phase}
                </h3>
                <h4>{year.title}</h4>
                <p>{year.focus}</p>
                <p>{year.capabilities.join(' · ')}</p>
                <p>可能的學習活動：{year.activities}</p>
              </li>
            ))}
          </ol>
        </details>
      </main>
      <footer className="wb-footer">
        {meta.department} · 資料版本 {meta.sourceVersion}
        <br />
        星圖是探索入口，不是先修順序或選課承諾。
      </footer>
    </div>
  )
}

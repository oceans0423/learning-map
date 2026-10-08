import { useEffect, useState } from 'react'
import { courses, meta } from './data/courses'
import { FOCUS_OPTIONS, type FocusId } from './config/focus'
import { LEARNING_PATH } from './data/learningPath'
import { YearAccordion } from './components/YearAccordion'
import { StructureDiagram } from './components/StructureDiagram'
import { CourseDetailsDialog } from './components/CourseDetailsDialog'
import { ExplorerAtlas } from './components/ExplorerAtlas'
import {
  closeCourseUrlState,
  parseUrlState,
  pushCourseUrlState,
  replaceUrlState,
} from './lib/urlState'
import { getVisibleCourses, SEMESTER_OPTIONS } from './lib/semester'
import { isCourseHighlighted } from './lib/highlight'

const requiredCount = courses.filter((course) => course.type === 'required').length

export function App() {
  const [mapState, setMapState] = useState(() => parseUrlState(window.location.search))

  useEffect(() => {
    const syncFromHistory = () => setMapState(parseUrlState(window.location.search))
    window.addEventListener('popstate', syncFromHistory)
    return () => window.removeEventListener('popstate', syncFromHistory)
  }, [])

  const visibleCourses = getVisibleCourses(courses, mapState.semester)
  const activeCourse = courses.find((course) => course.id === mapState.courseId) ?? null
  const highlightedCount = visibleCourses.filter((course) =>
    isCourseHighlighted(course, mapState.focus),
  ).length

  function toggleYear(year: number) {
    const openYears = mapState.openYears.includes(year)
      ? mapState.openYears.filter((openYear) => openYear !== year)
      : [...mapState.openYears, year]
    const nextState = { ...mapState, openYears }
    replaceUrlState(nextState)
    setMapState(nextState)
  }

  function openCourse(courseId: string) {
    pushCourseUrlState(mapState, courseId)
    setMapState((current) => ({ ...current, courseId }))
  }

  function changeSemester(semester: (typeof SEMESTER_OPTIONS)[number]['value']) {
    const nextState = { ...mapState, semester }
    replaceUrlState(nextState)
    setMapState(nextState)
  }

  function toggleFocus(focus: FocusId) {
    const selected = mapState.focus.includes(focus)
      ? mapState.focus.filter((item) => item !== focus)
      : [...mapState.focus, focus]
    const nextState = { ...mapState, focus: selected }
    replaceUrlState(nextState)
    setMapState(nextState)
  }

  function clearFocus() {
    const nextState = { ...mapState, focus: [] }
    replaceUrlState(nextState)
    setMapState(nextState)
  }

  function closeCourse() {
    const closeAction = closeCourseUrlState(mapState)
    if (closeAction === 'replaced') {
      const nextState = { ...mapState, courseId: null }
      setMapState(nextState)
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#curriculum">
        跳至課程地圖
      </a>
      <header className="site-header site-shell">
        <a className="brand" href="#top" aria-label={`${meta.department}，回到頁首`}>
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path d="M16 2 21 11 30 16 21 21 16 30 11 21 2 16 11 11Z" stroke="currentColor" />
              <path d="M16 8 19 16 16 24 13 16Z" fill="currentColor" />
            </svg>
          </span>
          <span className="brand-name">
            人文跨域與應用學系<small>THE HUMANITIES ATLAS</small>
          </span>
        </a>
        <a className="header-link" href="#curriculum">
          展開你的地圖 <span aria-hidden="true">↗</span>
        </a>
      </header>

      <main>
        <section className="hero site-shell" id="top" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="live-dot" aria-hidden="true" /> 115 學年度 · 人文探索指南
            </p>
            <h1 className="display-type" id="hero-title">
              世界還有很多，
              <br />
              <span>等你親自發現。</span>
            </h1>
            <p className="hero-description">
              一段故事、一種媒介、一個真實的現場。從人文出發，循著好奇心探索四年，把你對世界的提問，變成自己的作品與行動。
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#curriculum">
                開始探索課程 <span aria-hidden="true">↗</span>
              </a>
              <a className="hero-secondary" href="#structure">
                先找一個感興趣的方向 <span aria-hidden="true">↓</span>
              </a>
            </div>
            <p className="hero-footnote">
              {courses.length} 門規劃課程 <span aria-hidden="true">·</span> {requiredCount}{' '}
              門必修 <span aria-hidden="true">·</span> 三個探索面向
            </p>
          </div>
          <ExplorerAtlas />
          <div className="hero-bottom">
            <span>閱讀是起點，世界是你的現場。</span>
            <span>
              SCROLL TO EXPLORE <i aria-hidden="true">↓</i>
            </span>
          </div>
        </section>

        <section className="structure-section" id="structure" aria-labelledby="structure-title">
          <div className="site-shell">
            <div className="section-heading">
              <div>
                <p className="eyebrow">01 / 選擇探索方向</p>
                <h2 className="display-type" id="structure-title">
                  跟著好奇心，
                  <br className="mobile-only" />
                  找到你的入口。
                </h2>
              </div>
              <p>
                共同的人文基礎，延伸出不同的探索方向，最後在專題與實作中交會。面向可以交錯選擇，沒有固定分流。
              </p>
            </div>
            <StructureDiagram selected={mapState.focus} onToggle={toggleFocus} />
            <div className="structure-guide">
              <p>
                <span aria-hidden="true">＋</span>{' '}
                點選區域，讓相關課程亮起；可以同時探索多個方向。
              </p>
              <a href="#curriculum">
                前往課程地圖 <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </section>

        <section
          className="learning-section site-shell"
          id="learning"
          aria-labelledby="learning-title"
        >
          <div className="section-heading section-heading-compact">
            <div>
              <p className="eyebrow">02 / 四年旅程</p>
              <h2 className="display-type" id="learning-title">
                一步一步，走向更大的世界。
              </h2>
            </div>
            <p>從探索與奠基，走向方法、實作與展現。</p>
          </div>
          <ol className="learning-path">
            {LEARNING_PATH.map((year) => (
              <li className="learning-year" key={year.year}>
                <span className="learning-year-index">
                  0{year.year}
                  <small>大{['一', '二', '三', '四'][year.year - 1]}</small>
                </span>
                <p className="learning-year-phase">{year.phase}</p>
                <h3>{year.title}</h3>
                <p className="learning-year-focus">{year.focus}</p>
                <div className="capability-list" aria-label="培養能力">
                  {year.capabilities.map((capability) => (
                    <span key={capability}>{capability}</span>
                  ))}
                </div>
                <p className="learning-year-activity">
                  <span>可能的學習活動</span>
                  {year.activities}
                </p>
                <a
                  className="learning-year-link"
                  href={`#year-${year.year}-heading`}
                  onClick={() => {
                    if (!mapState.openYears.includes(year.year)) toggleYear(year.year)
                  }}
                >
                  探索這一年的課程 <span aria-hidden="true">↗</span>
                </a>
              </li>
            ))}
          </ol>
        </section>

        <section
          className="curriculum-section"
          id="curriculum"
          aria-labelledby="curriculum-title"
        >
          <div className="site-shell">
            <div className="section-heading section-heading-compact">
              <div>
                <p className="eyebrow">03 / 深入課程地圖</p>
                <h2 className="display-type" id="curriculum-title">
                  四年課程地圖
                </h2>
              </div>
              <p>打開一個年級，發現新的學習節點。點選課程，就能查看它在四年旅程中的位置。</p>
            </div>
            <div className="curriculum-controls" aria-label="課程地圖控制區">
              <fieldset className="semester-picker">
                <legend>顯示學期</legend>
                <div className="semester-options">
                  {SEMESTER_OPTIONS.map((option) => (
                    <button
                      className="focus-control semester-option"
                      type="button"
                      key={option.value}
                      aria-pressed={mapState.semester === option.value}
                      onClick={() => changeSemester(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <p className="visible-count" aria-live="polite">
                顯示 {visibleCourses.length} 門規劃課程
              </p>
            </div>
            {mapState.focus.length > 0 && (
              <div className="focus-status" aria-live="polite" aria-atomic="true">
                <div className="focus-status-copy">
                  <div className="selected-focus-list" aria-label="目前強調條件">
                    {mapState.focus.map((id) => {
                      const option = FOCUS_OPTIONS.find((item) => item.id === id)!
                      return (
                        <span className="selected-focus-chip" key={id}>
                          {option.label}
                        </span>
                      )
                    })}
                  </div>
                  <p>已強調 {highlightedCount} 門相關課程，其他課程仍保留顯示。</p>
                </div>
                <button className="clear-focus" type="button" onClick={clearFocus}>
                  清除條件
                </button>
              </div>
            )}
            <div className="curriculum-years" aria-label="四年課程">
              <YearAccordion
                courses={visibleCourses}
                openYears={mapState.openYears}
                onToggle={toggleYear}
                onCourseSelect={(course) => openCourse(course.id)}
                focus={mapState.focus}
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="site-shell footer-content">
          <div>
            <p className="footer-title">人文跨域與應用學系</p>
            <p>文學文化是起點，理解世界是方法，讓想法落地是實踐。</p>
          </div>
          <p className="footer-note">資料版本：{meta.sourceVersion} · 實際開課依當學年度課表</p>
        </div>
      </footer>
      {activeCourse && <CourseDetailsDialog course={activeCourse} onClose={closeCourse} />}
    </div>
  )
}

import { useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { CourseAtlasShell } from './CourseAtlasShell'
import { CourseAtlasOverview } from './CourseAtlasOverview'
import { CourseAtlasResults } from './CourseAtlasResults'
import { CourseAtlasConstellation } from './CourseAtlasConstellation'
import {
  CourseZodiacMatch,
  CourseZodiacExplorer,
  CourseZodiacYears,
} from './CourseZodiacControls'
import { matchZodiac, selectZodiacCourses, zodiacCourseConnection } from '../lib/zodiac'
import { zodiacProfilesById } from '../data/zodiac'
import type { ZodiacId } from '../config/zodiac'
import { CourseDetailsDialog } from './CourseDetailsDialog'
import { PersonalStorageControls } from './PersonalStorageControls'
import { ConstellationEditor } from './ConstellationEditor'
import { Button } from './Button'
import { PersonalRoleResults } from './PersonalRoleResults'
import { courses } from '../data/courses'
import { COURSE_AREAS, YEAR_LABELS } from '../config/courseAreas'
import { selectAtlasCourses, type AtlasScope } from '../lib/courseAtlas'
import { searchCourses } from '../lib/search'
import {
  atlasRouteUrl,
  closeAtlasCourse,
  openAtlasCourse,
  parseAtlasRoute,
  writeAtlasRoute,
  type AtlasRoute,
} from '../lib/courseAtlasRoute'
import { loadPersonal } from '../lib/personalStorage'
import { personalReducer } from '../lib/personal'
import { usePersonalStorage } from '../lib/usePersonalStorage'
import '../styles/constellation.css'

interface FocusPlan {
  target: string
  scroll?: number
}

function focusTarget() {
  const node = document.activeElement as HTMLElement | null
  if (node?.dataset.atlasCourse) return '[data-atlas-course="' + node.dataset.atlasCourse + '"]'
  if (node?.dataset.area) return '[data-area="' + node.dataset.area + '"]'
  if (node?.dataset.year) return '[data-year="' + node.dataset.year + '"]'
  if (node?.dataset.starCourse) return '[data-star-course="' + node.dataset.starCourse + '"]'
  return node?.id ? '#' + node.id : '#atlas-content-title'
}

/** One dataset, one detail panel and the existing personal state. */
export function CourseAtlasApp() {
  const [route, setRoute] = useState(() => parseAtlasRoute(window.location.search))
  const [loaded] = useState(loadPersonal)
  const [personal, dispatch] = useReducer(personalReducer, loaded.state)
  const storage = usePersonalStorage(personal, loaded)
  const [source, setSource] = useState<HTMLElement | null>(null)
  const mineSource = useRef<{ route: AtlasRoute; scroll: number; focus: string } | null>(null)
  const zodiacSource = useRef<{ route: AtlasRoute; scroll: number; focus: string } | null>(null)
  const pendingFocus = useRef<FocusPlan | null>(null)
  const routeSearch = useRef(window.location.search)
  const [legacyNotice, setLegacyNotice] = useState(() =>
    /[?&](focus|signals|open|atlas|sem)=/.test(window.location.search),
  )

  // Complete navigation focus before paint, never in a later animation frame
  // that could steal focus from a user who has already started pressing Tab.
  useLayoutEffect(() => {
    routeSearch.current = window.location.search
    const plan = pendingFocus.current
    pendingFocus.current = null
    if (!plan) return
    document
      .querySelector<HTMLElement>(plan.target)
      ?.focus({ preventScroll: plan.scroll !== undefined })
    if (plan.scroll !== undefined) window.scrollTo({ top: plan.scroll, behavior: 'instant' })
  }, [route])

  useEffect(() => {
    function sync() {
      // Native skip-link/hash navigation already manages its own focus.
      if (window.location.search === routeSearch.current) return
      const next = parseAtlasRoute(window.location.search)
      const data = window.history.state
      pendingFocus.current = next.courseId
        ? null
        : {
            target:
              typeof data?.__atlasFocus === 'string'
                ? data.__atlasFocus
                : '#atlas-content-title',
            scroll:
              typeof data?.__atlasScroll === 'number' ? data.__atlasScroll : window.scrollY,
          }
      setRoute(next)
    }
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
  }, [])

  function remember() {
    window.history.replaceState(
      { ...window.history.state, __atlasScroll: window.scrollY, __atlasFocus: focusTarget() },
      '',
    )
  }
  function navigate(
    next: AtlasRoute,
    mode: 'push' | 'replace' = 'push',
    focus: boolean | FocusPlan = true,
  ) {
    if (mode === 'push') remember()
    const closed = { ...next, courseId: null }
    writeAtlasRoute(closed, mode)
    pendingFocus.current = focus === true ? { target: '#atlas-content-title' } : focus || null
    setRoute(closed)
  }
  function selectScope(scope: AtlasScope | null) {
    navigate({
      ...route,
      screen: 'map',
      scope,
      filters: {},
      query: '',
      anchor: 0,
      searchAnchor: 0,
    })
  }
  function openCourse(id: string, element: HTMLElement) {
    setSource(element)
    if (!route.courseId) {
      window.history.replaceState(
        window.history.state,
        '',
        atlasRouteUrl(route, window.location),
      )
      remember()
    }
    setRoute(openAtlasCourse(route, id))
  }
  function closeCourse() {
    if (closeAtlasCourse(route) === 'replaced') setRoute({ ...route, courseId: null })
  }
  function showMine() {
    if (route.screen === 'map')
      mineSource.current = {
        route: { ...route, courseId: null },
        scroll: window.scrollY,
        focus: focusTarget(),
      }
    // Browsing another theme must not become an implicit personal shape choice.
    const personalRoute = route.screen === 'zodiac' ? zodiacSource.current?.route : route
    navigate({
      ...route,
      zodiac: personalRoute?.zodiac ?? null,
      screen: 'mine',
      query: '',
      mineAnchor: 0,
    })
  }
  function returnFromMine() {
    const saved = mineSource.current
    if (!saved) return selectScope(null)
    navigate(saved.route, 'push', { target: saved.focus, scroll: saved.scroll })
  }
  function exploreZodiac(id: ZodiacId) {
    zodiacSource.current = {
      route: { ...route, courseId: null },
      scroll: window.scrollY,
      focus: focusTarget(),
    }
    navigate({
      ...route,
      screen: 'zodiac',
      zodiac: id,
      zodiacAnchor: 0,
      zodiacYear: null,
      query: '',
    })
  }
  function returnFromZodiac() {
    const saved = zodiacSource.current
    if (!saved) return navigate({ ...route, screen: 'mine', zodiac: null, query: '' })
    navigate(saved.route, 'push', { target: saved.focus, scroll: saved.scroll })
  }
  const active = courses.find((course) => course.id === route.courseId)
  const mine = !route.query && (route.screen === 'mine' || route.screen === 'constellation')
  const constellation = mine && route.screen === 'constellation' && personal.ids.length > 0
  const legacy = !route.query && route.screen === 'legacy'
  const zodiac = !route.query && route.screen === 'zodiac'
  const match = matchZodiac(personal.ids)
  const profile =
    zodiacProfilesById[
      route.zodiac ?? (zodiac ? 'aries' : (match?.ranked[0].profile.id ?? 'scorpio'))
    ]
  const showingResults = !!route.query || mine || zodiac || !!route.scope
  const currentScope = route.scope
  const title = route.query
    ? '全部課程的搜尋結果：' + route.query
    : mine
      ? '我的課程'
      : zodiac
        ? '探索十二星座'
        : currentScope?.kind === 'area'
          ? COURSE_AREAS.find((area) => area.id === currentScope.area)!.label
          : currentScope?.kind === 'year'
            ? YEAR_LABELS[currentScope.year - 1] + '課程'
            : '全部課程'
  const results = route.query
    ? selectAtlasCourses(searchCourses(courses, route.query))
    : mine
      ? selectAtlasCourses(courses.filter((course) => personal.ids.includes(course.id)))
      : zodiac
        ? selectAtlasCourses(selectZodiacCourses(profile, route.zodiacYear))
        : selectAtlasCourses(courses, route.scope ?? { kind: 'all' }, route.filters)
  const anchor = route.query
    ? route.searchAnchor
    : mine
      ? route.mineAnchor
      : zodiac
        ? route.zodiacAnchor
        : route.anchor

  return (
    <CourseAtlasShell
      query={route.query}
      onSearch={(query) => navigate({ ...route, query, searchAnchor: 0 })}
      onMap={() => selectScope(null)}
      onMine={showMine}
      count={personal.ids.length}
      mine={mine || legacy || zodiac}
    >
      {legacyNotice && (
        <aside className="ca-legacy-notice">
          <p>這個連結使用舊導覽條件。已依年級／學期定位；探索面向與訊號不限制新版結果。</p>
          <Button onClick={() => setLegacyNotice(false)}>關閉說明</Button>
        </aside>
      )}
      <div className={active ? 'ca-layout has-detail' : 'ca-layout'}>
        <div className="ca-primary">
          {legacy ? (
            <section
              id="atlas-content"
              className="ca-content"
              aria-labelledby="atlas-content-title"
            >
              <h2 id="atlas-content-title" tabIndex={-1}>
                既有星座作品
              </h2>
              <p>保留舊作品的代表星與名稱；這不是新版課程地圖的必要操作。</p>
              <ConstellationEditor state={personal} dispatch={dispatch} onReturn={showMine} />
            </section>
          ) : showingResults ? (
            <>
              <CourseAtlasResults
                title={title}
                courses={results}
                scope={
                  mine || zodiac || route.query
                    ? { kind: 'all' }
                    : (route.scope ?? { kind: 'all' })
                }
                filters={mine || zodiac || route.query ? {} : route.filters}
                filterable={!mine && !zodiac && !route.query}
                anchor={anchor}
                activeId={route.courseId}
                collectedIds={personal.ids}
                courseNote={
                  zodiac
                    ? (course) => {
                        const connection = zodiacCourseConnection(profile, course.id)
                        return connection
                          ? `${profile.label}角度：${connection.reason}`
                          : undefined
                      }
                    : undefined
                }
                onFilters={(filters) =>
                  navigate({ ...route, filters, anchor: 0 }, 'replace', false)
                }
                onAnchor={(value) =>
                  navigate(
                    {
                      ...route,
                      ...(route.query
                        ? { searchAnchor: value }
                        : mine
                          ? { mineAnchor: value }
                          : zodiac
                            ? { zodiacAnchor: value }
                            : { anchor: value }),
                    },
                    'replace',
                    zodiac ? { target: '#atlas-zodiac-courses-title' } : true,
                  )
                }
                returnLabel={mine ? '← 返回找課' : zodiac ? '← 返回我的課程' : undefined}
                onReturn={() =>
                  mine ? returnFromMine() : zodiac ? returnFromZodiac() : selectScope(null)
                }
                onAll={() => selectScope({ kind: 'all' })}
                onCourse={openCourse}
                emptyContent={
                  mine ? (
                    <>
                      <p>還沒有加入感興趣的課程。可以先回地圖找課，不必使用收藏或星座。</p>
                      <Button onClick={returnFromMine}>回課程地圖</Button>
                    </>
                  ) : undefined
                }
              >
                {mine && (
                  <>
                    <PersonalRoleResults ids={personal.ids} onCourse={openCourse} />
                    <div className="ca-mine-presentation">
                      <p>課程清單是主角；角色方向與星座都是可選的探索方式。</p>
                      <div className="ca-zodiac-actions">
                        {personal.ids.length > 0 && (
                          <>
                            <Button
                              id="atlas-mine-view"
                              onClick={() =>
                                navigate(
                                  {
                                    ...route,
                                    screen: constellation ? 'mine' : 'constellation',
                                  },
                                  'push',
                                  {
                                    target: constellation
                                      ? '#atlas-content-title'
                                      : '#atlas-match-title',
                                  },
                                )
                              }
                            >
                              {constellation ? '返回課程清單' : '找到我的星座'}
                            </Button>
                          </>
                        )}
                        <Button
                          id="atlas-explore-zodiac"
                          onClick={() => exploreZodiac(profile.id)}
                        >
                          探索十二星座
                        </Button>
                      </div>
                    </div>
                  </>
                )}
                {constellation && match && (
                  <>
                    <div className="ca-zodiac-layout">
                      <div className="ca-zodiac-presentation">
                        <CourseZodiacMatch
                          match={match}
                          profile={profile}
                          manual={route.zodiac}
                          onShape={(zodiac) => navigate({ ...route, zodiac }, 'push', false)}
                          onExplore={() => exploreZodiac(profile.id)}
                        />
                        <CourseAtlasConstellation
                          key={profile.id}
                          profile={profile}
                          ids={personal.ids}
                          onCourse={openCourse}
                        />
                      </div>
                    </div>
                    <h3 className="ca-mine-list-heading">完整課程清單</h3>
                  </>
                )}
                {zodiac && (
                  <>
                    <div className="ca-zodiac-layout">
                      <div className="ca-zodiac-presentation">
                        <CourseZodiacExplorer
                          profile={profile}
                          onChange={(zodiac) =>
                            navigate({ ...route, zodiac, zodiacAnchor: 0 }, 'push', false)
                          }
                        />
                        <CourseAtlasConstellation
                          key={`${profile.id}-${route.zodiacYear ?? 'all'}`}
                          profile={profile}
                          preview
                          ids={results.map((course) => course.id)}
                          onCourse={openCourse}
                        />
                      </div>
                    </div>
                    <h3
                      className="ca-mine-list-heading"
                      id="atlas-zodiac-courses-title"
                      tabIndex={-1}
                    >
                      {route.zodiacYear ? YEAR_LABELS[route.zodiacYear - 1] : '四年'}主題課程 ·
                      逐門查看與加入
                    </h3>
                    <CourseZodiacYears
                      profile={profile}
                      year={route.zodiacYear}
                      onYear={(zodiacYear) =>
                        navigate({ ...route, zodiacYear, zodiacAnchor: 0 }, 'push', false)
                      }
                    />
                  </>
                )}
              </CourseAtlasResults>
              {mine && (
                <section className="ca-personal" aria-label="個人記錄與保存">
                  <p>
                    這是感興趣的課程，不是正式選課，也不代表已修課。清單與星座使用同一份收藏。
                  </p>
                  {personal.representatives.length > 0 && (
                    <Button onClick={() => navigate({ ...route, screen: 'legacy' })}>
                      查看既有星座作品
                    </Button>
                  )}
                  <PersonalStorageControls {...storage} headingLevel={3} />
                </section>
              )}
            </>
          ) : (
            <CourseAtlasOverview
              perspective={route.perspective}
              onPerspective={(perspective) =>
                navigate(
                  { ...route, perspective, scope: null, filters: {}, anchor: 0 },
                  'replace',
                  false,
                )
              }
              onScope={selectScope}
            />
          )}
          {(personal.undo || (!active && personal.message)) && (
            <div className="ca-personal-feedback">
              <p role="status">{personal.message}</p>
              {personal.undo && (
                <Button onClick={() => dispatch({ type: 'undo' })}>復原最近移除</Button>
              )}
            </div>
          )}
        </div>
        {active && (
          <CourseDetailsDialog
            course={active}
            responsive
            presentation="atlas"
            sourceElement={source}
            onClose={closeCourse}
            collected={personal.ids.includes(active.id)}
            onToggleCollection={() =>
              dispatch({
                type: personal.ids.includes(active.id) ? 'remove' : 'add',
                id: active.id,
              })
            }
            collectionMessage={personal.message}
          />
        )}
      </div>
    </CourseAtlasShell>
  )
}

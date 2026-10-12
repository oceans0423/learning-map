import { useEffect, useState } from 'react'
import type { Course } from '../types/course'
import type { FocusId } from '../config/focus'
import { LEARNING_PATH } from '../data/learningPath'
import { SIGNAL_BY_ID, type SignalId } from '../config/explorationSignals'
import { getCourseSignal, getRelatedCourses } from '../data/explorationSignals'
import { isCourseHighlighted } from '../lib/highlight'
import { pageWindow, semesterCourses } from '../lib/atlas'
import { Button } from './Button'
import '../styles/atlas.css'

interface Props {
  courses: readonly Course[]
  year: number | null
  semester: 1 | 2
  focus: readonly FocusId[]
  signals: readonly SignalId[]
  activeId: string | null
  onYear: (year: number | null) => void
  onSemester: (semester: 1 | 2) => void
  onCourse: (course: Course) => void
}

export function SemesterAtlas(props: Props) {
  return props.year === null ? (
    <div className="atlas-overview" aria-label="四年總覽">
      {LEARNING_PATH.map((year) => (
        <Button
          key={year.year}
          className="atlas-year"
          onClick={() => props.onYear(year.year)}
          aria-label={`查看大${['一', '二', '三', '四'][year.year - 1]}課程`}
        >
          <span className="atlas-year-visual" aria-hidden="true">
            <span className="atlas-year-number">0{year.year}</span>
            {[0, 1, 2, 3, 4].map((i) => (
              <i
                key={i}
                style={{
                  left: `${[18, 70, 80, 35, 54][i]}%`,
                  top: `${[22, 17, 65, 78, 50][i]}%`,
                }}
              />
            ))}
          </span>
          <span className="atlas-year-title">
            大{['一', '二', '三', '四'][year.year - 1]}{' '}
            <small>{props.courses.filter((c) => c.year === year.year).length} 門</small>
          </span>
          <span className="atlas-year-phase">{year.phase}</span>
          <span className="atlas-year-description">{year.focus}</span>
          <span className="atlas-year-action">查看課程 ↗</span>
        </Button>
      ))}
    </div>
  ) : (
    <SemesterScene key={`${props.year}-${props.semester}`} {...props} />
  )
}

function SemesterScene({
  courses,
  year,
  semester,
  focus,
  signals,
  activeId,
  onYear,
  onSemester,
  onCourse,
}: Props) {
  const list = semesterCourses(courses, year!, semester)
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [anchor, setAnchor] = useState(() =>
    Math.max(
      0,
      list.findIndex((c) => c.id === activeId),
    ),
  )
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const sync = () => setCompact(media.matches)
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])
  const group = pageWindow(list.length, anchor, compact ? 6 : 12)
  const visible = list.slice(group.start, group.end)
  const related = getRelatedCourses(list, signals)
  const integrationCount = list.filter((course) => course.role === 'integration').length
  return (
    <div className="atlas-semester">
      <div className="atlas-navigation">
        <Button onClick={() => onYear(null)}>返回總覽</Button>
        <div role="group" aria-label="選擇年級">
          {[1, 2, 3, 4].map((y) => (
            <Button key={y} aria-pressed={year === y} onClick={() => onYear(y)}>
              大{['一', '二', '三', '四'][y - 1]}
            </Button>
          ))}
        </div>
      </div>
      <div className="atlas-heading">
        <h3>
          大{['一', '二', '三', '四'][year! - 1]} · {semester === 1 ? '上' : '下'}學期
        </h3>
        <div role="group" aria-label="選擇學期">
          {([1, 2] as const).map((s) => (
            <Button key={s} aria-pressed={semester === s} onClick={() => onSemester(s)}>
              {semester === s ? '✓ ' : ''}
              {s === 1 ? '上學期' : '下學期'}
            </Button>
          ))}
        </div>
      </div>
      <p className="atlas-count" role="status">
        本學期 {list.length} 門
        {signals.length > 0 && (
          <>
            {' '}
            · 相關 {related.length} 門 · 整合匯流 {integrationCount} 門
            {related.length === 0 && '；這學期沒有符合訊號的課程，其他課仍可查看。'}
          </>
        )}
      </p>
      <div className="atlas-scene" aria-label="本學期課程星圖">
        {visible.map((course) => {
          const signal = getCourseSignal(course.id)
          const highlighted =
            related.some((item) => item.id === course.id) || isCourseHighlighted(course, focus)
          return (
            <Button
              key={course.id}
              className={`atlas-course${course.id === activeId ? ' is-current' : ''}${highlighted ? ' is-related' : ''}${signals.length && !highlighted ? ' is-unrelated' : ''}`}
              data-course-id={course.id}
              data-signal={signal.primary ?? undefined}
              onClick={() => onCourse(course)}
              aria-label={`查看課程：${course.name}`}
            >
              <span className={`atlas-star atlas-star--${course.role}`} aria-hidden="true">
                {course.role === 'foundation' ? '◆' : course.role === 'integration' ? '✦' : '○'}
              </span>
              <strong>{course.name}</strong>
              {signals.length > 0 && related.some((item) => item.id === course.id) && (
                <span className="atlas-related-label">✓ 相關課程</span>
              )}
              <span className="atlas-course-meta">
                {course.type === 'required' ? '必修' : '選修'} · {course.credits} 學分 ·{' '}
                {course.role === 'foundation'
                  ? '基底'
                  : course.role === 'integration'
                    ? '整合匯流'
                    : '應用'}
              </span>
              <span className="atlas-course-signal">
                {signal.primary ? SIGNAL_BY_ID[signal.primary].label : '整合匯流'}
              </span>
              {signal.secondary && (
                <span className="atlas-course-secondary">
                  也關聯：{SIGNAL_BY_ID[signal.secondary].label}
                </span>
              )}
            </Button>
          )
        })}
      </div>
      {group.pages > 1 && (
        <nav className="atlas-pagination" aria-label="學期課程分組">
          <Button
            disabled={group.page === 0}
            onClick={() => setAnchor(Math.max(0, group.start - 6))}
          >
            上一組
          </Button>
          <span>
            第 {group.page + 1}／{group.pages} 組 · {group.start + 1}–{group.end} 門
          </span>
          <Button
            disabled={group.page === group.pages - 1}
            onClick={() => setAnchor(group.start + 6)}
          >
            下一組
          </Button>
        </nav>
      )}
      <p className="atlas-legend">
        ◆ 基底 · ○ 應用 · ✦ 整合匯流 · 點選星點或課名查看課程；位置不代表先修或重要性。
      </p>
    </div>
  )
}

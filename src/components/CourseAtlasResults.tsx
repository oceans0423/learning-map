import { useEffect, useState, type ReactNode } from 'react'
import type { Course } from '../types/course'
import { COURSE_AREAS, YEAR_LABELS, courseArea, type CourseAreaId } from '../config/courseAreas'
import { atlasPage, type AtlasFilters, type AtlasScope } from '../lib/courseAtlas'
import { Button } from './Button'

interface Props {
  title: string
  courses: readonly Course[]
  scope: AtlasScope
  filters: AtlasFilters
  filterable?: boolean
  anchor: number
  activeId?: string | null
  collectedIds: readonly string[]
  onFilters: (filters: AtlasFilters) => void
  onAnchor: (anchor: number) => void
  onReturn: () => void
  returnLabel?: string
  onAll: () => void
  onCourse: (id: string, source: HTMLElement) => void
  children?: ReactNode
  emptyContent?: ReactNode
  courseNote?: (course: Course) => string | undefined
}

export function CourseAtlasResults({
  title,
  courses,
  scope,
  filters,
  filterable = true,
  anchor,
  activeId,
  collectedIds,
  onFilters,
  onAnchor,
  onReturn,
  returnLabel = '← 返回總覽',
  onAll,
  onCourse,
  children,
  emptyContent,
  courseNote,
}: Props) {
  const [compact, setCompact] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const sync = () => setCompact(media.matches)
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])
  const page = atlasPage(courses.length, anchor, compact ? 6 : 12)
  const filterLabels = [
    filters.area && COURSE_AREAS.find((area) => area.id === filters.area)?.label,
    filters.year && YEAR_LABELS[filters.year - 1],
    filters.semester && (filters.semester === 1 ? '上學期' : '下學期'),
    filters.type && (filters.type === 'required' ? '必修' : '選修'),
  ].filter(Boolean)
  return (
    <section
      className="ca-content ca-results"
      id="atlas-content"
      tabIndex={-1}
      aria-labelledby="atlas-content-title"
    >
      <div className="ca-breadcrumb">
        <Button onClick={onReturn}>{returnLabel}</Button>
        <span>課程地圖 / {title}</span>
      </div>
      <div className="ca-section-heading">
        <h2 id="atlas-content-title" tabIndex={-1}>
          {title}
        </h2>
        <span className="ca-result-count" role="status">
          共 {courses.length} 門課程
        </span>
      </div>
      {children}
      {filterable && (
        <div className="ca-filters">
          {scope.kind !== 'year' && (
            <label>
              年級
              <select
                aria-label="篩選年級"
                value={filters.year ?? ''}
                onChange={(event) =>
                  onFilters({
                    ...filters,
                    year: event.target.value
                      ? (Number(event.target.value) as Course['year'])
                      : undefined,
                  })
                }
              >
                <option value="">全部年級</option>
                {YEAR_LABELS.map((year, index) => (
                  <option key={year} value={index + 1}>
                    {year}
                  </option>
                ))}
              </select>
            </label>
          )}
          {scope.kind !== 'area' && (
            <label>
              領域
              <select
                aria-label="篩選領域"
                value={filters.area ?? ''}
                onChange={(event) =>
                  onFilters({
                    ...filters,
                    area: event.target.value ? (event.target.value as CourseAreaId) : undefined,
                  })
                }
              >
                <option value="">全部領域</option>
                {COURSE_AREAS.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <details className="ca-more-filters">
            <summary>更多篩選{filters.semester || filters.type ? ' · 已啟用' : ''}</summary>
            <div>
              <label>
                學期
                <select
                  aria-label="篩選學期"
                  value={filters.semester ?? ''}
                  onChange={(event) =>
                    onFilters({
                      ...filters,
                      semester: event.target.value
                        ? (Number(event.target.value) as Course['semester'])
                        : undefined,
                    })
                  }
                >
                  <option value="">全部學期</option>
                  <option value="1">上學期</option>
                  <option value="2">下學期</option>
                </select>
              </label>
              <label>
                必修／選修
                <select
                  aria-label="篩選必選修"
                  value={filters.type ?? ''}
                  onChange={(event) =>
                    onFilters({
                      ...filters,
                      type: event.target.value
                        ? (event.target.value as Course['type'])
                        : undefined,
                    })
                  }
                >
                  <option value="">全部修別</option>
                  <option value="required">必修</option>
                  <option value="elective">選修</option>
                </select>
              </label>
            </div>
          </details>
        </div>
      )}
      {filterLabels.length > 0 && (
        <div className="ca-active-filters">
          <p>目前篩選：{filterLabels.join(' · ')}</p>
          <Button onClick={() => onFilters({})}>清除篩選</Button>
        </div>
      )}
      {courses.length > 0 ? (
        <ul className="ca-course-list">
          {courses.slice(page.start, page.end).map((course) => (
            <li key={course.id}>
              <button
                className={`ca-course${activeId === course.id ? ' is-current' : ''}`}
                type="button"
                data-atlas-course={course.id}
                aria-label={`查看課程：${course.name}`}
                aria-describedby={
                  courseNote?.(course) ? `atlas-course-note-${course.id}` : undefined
                }
                onClick={(event) => onCourse(course.id, event.currentTarget)}
              >
                <span className="ca-course-star" aria-hidden="true">
                  ✦
                </span>
                <span className="ca-course-copy">
                  <strong>{course.name}</strong>
                  <span>
                    {YEAR_LABELS[course.year - 1]} ·{' '}
                    {course.semester === 1 ? '上學期' : '下學期'} ·{' '}
                    {course.type === 'required' ? '必修' : '選修'} · {course.credits} 學分
                  </span>
                  <span className="ca-course-area">
                    {courseArea(course.module).label}
                    {collectedIds.includes(course.id) ? ' · ✓ 已加入我的課程' : ''}
                  </span>
                  {courseNote?.(course) && (
                    <span
                      className="ca-course-theme-note"
                      id={`atlas-course-note-${course.id}`}
                    >
                      {courseNote(course)}
                    </span>
                  )}
                </span>
                <span className="ca-course-arrow" aria-hidden="true">
                  ↗
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="ca-empty">
          {emptyContent ?? (
            <>
              <p>目前沒有符合條件的課程。</p>
              <p>可以清除篩選、返回總覽，或查看全部課程。</p>
              <Button onClick={onAll}>查看全部 69 門課程</Button>
            </>
          )}
        </div>
      )}
      {page.pages > 1 && (
        <nav className="ca-pagination" aria-label="課程分頁">
          <Button
            disabled={page.page === 0}
            onClick={() => onAnchor(Math.max(0, page.start - (compact ? 6 : 12)))}
          >
            上一頁
          </Button>
          <span>
            第 {page.page + 1}／{page.pages} 頁 · {page.start + 1}–{page.end} 門
          </span>
          <Button disabled={page.page === page.pages - 1} onClick={() => onAnchor(page.end)}>
            下一頁
          </Button>
        </nav>
      )}
    </section>
  )
}

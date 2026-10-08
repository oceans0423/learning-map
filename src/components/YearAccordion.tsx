import { useState } from 'react'
import type { Course } from '../types/course'
import { CourseCard } from './CourseCard'
import { isCourseHighlighted } from '../lib/highlight'
import type { FocusId } from '../config/focus'

const yearLabels = ['大一', '大二', '大三', '大四'] as const

interface YearAccordionProps {
  courses: readonly Course[]
  openYears: readonly number[]
  onToggle: (year: number) => void
  onCourseSelect: (course: Course) => void
  focus: readonly FocusId[]
}

export function YearAccordion({
  courses,
  openYears,
  onToggle,
  onCourseSelect,
  focus,
}: YearAccordionProps) {
  const [expandedElectives, setExpandedElectives] = useState<number[]>([])

  return (
    <div className="year-list">
      {yearLabels.map((label, index) => {
        const year = index + 1
        const items = courses.filter((course) => course.year === year)
        const required = items.filter((course) => course.type === 'required')
        const electives = items.filter((course) => course.type === 'elective')
        const isOpen = openYears.includes(year)
        const electivesOpen = expandedElectives.includes(year)
        const panelId = `year-${year}-courses`
        const electivesId = `year-${year}-electives`

        return (
          <section className={`year-section${isOpen ? ' is-open' : ''}`} key={year}>
            <h3 className="year-heading">
              <button
                className="year-toggle"
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => onToggle(year)}
              >
                <span className="year-number">0{year}</span>
                <span className="year-label">{label}</span>
                <span className="year-count">{items.length} 門課程</span>
                <span className="year-chevron" aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
            </h3>
            <div className="year-panel" id={panelId} hidden={!isOpen}>
              {required.length > 0 && (
                <section className="course-group" aria-label={`${label}必修`}>
                  <h4 className="course-group-title">
                    <span>必修</span>
                    <span>{required.length} 門</span>
                  </h4>
                  <div className="course-card-list">
                    {required.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        onSelect={onCourseSelect}
                        highlighted={isCourseHighlighted(course, focus)}
                        dimmed={focus.length > 0 && !isCourseHighlighted(course, focus)}
                      />
                    ))}
                  </div>
                </section>
              )}
              {electives.length > 0 && (
                <section className="course-group elective-group" aria-label={`${label}選修`}>
                  <h4 className="course-group-title">
                    <button
                      className="elective-toggle"
                      type="button"
                      aria-expanded={electivesOpen}
                      aria-controls={electivesId}
                      onClick={() =>
                        setExpandedElectives((current) =>
                          current.includes(year)
                            ? current.filter((openYear) => openYear !== year)
                            : [...current, year],
                        )
                      }
                    >
                      選修 <span>共 {electives.length} 門</span>
                      <span aria-hidden="true">{electivesOpen ? '收合 −' : '展開 +'}</span>
                    </button>
                  </h4>
                  <div id={electivesId} hidden={!electivesOpen}>
                    <div className="course-card-list">
                      {electives.map((course) => (
                        <CourseCard
                          key={course.id}
                          course={course}
                          onSelect={onCourseSelect}
                          highlighted={isCourseHighlighted(course, focus)}
                          dimmed={focus.length > 0 && !isCourseHighlighted(course, focus)}
                        />
                      ))}
                    </div>
                  </div>
                </section>
              )}
              {items.length === 0 && <p className="no-courses">這個學期沒有規劃課程。</p>}
            </div>
          </section>
        )
      })}
    </div>
  )
}

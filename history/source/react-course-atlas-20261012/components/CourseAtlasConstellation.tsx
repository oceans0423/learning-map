import { useLayoutEffect, useRef, useState } from 'react'
import { courses } from '../data/courses'
import { assignZodiacCourses } from '../lib/zodiac'
import { zodiacProfilesById } from '../data/zodiac'
import type { ZodiacProfile } from '../config/zodiac'
import { Button } from './Button'

interface Props {
  ids: readonly string[]
  profile?: ZodiacProfile
  preview?: boolean
  onCourse: (id: string, source: HTMLElement) => void
}

/** A read-only projection of the same collection, not another course picker. */
export function CourseAtlasConstellation({
  ids,
  onCourse,
  profile = zodiacProfilesById.scorpio,
  preview = false,
}: Props) {
  const slots = assignZodiacCourses(profile, ids, courses)
  const [group, setGroup] = useState<number | null>(null)
  const groupTitle = useRef<HTMLHeadingElement>(null)
  const stars = useRef(new Map<number, HTMLButtonElement>())
  const grouped = group === null ? null : slots[group]

  useLayoutEffect(() => {
    if (group !== null) groupTitle.current?.focus()
  }, [group])

  function closeGroup() {
    const source = group === null ? null : stars.current.get(group)
    setGroup(null)
    source?.focus()
  }

  return (
    <section
      className="ca-constellation"
      data-zodiac={profile.id}
      aria-labelledby="atlas-star-title"
    >
      <header className="ca-star-heading">
        <div>
          <p className="ca-eyebrow">{profile.id.toUpperCase()} / COURSE CONSTELLATION</p>
          <h3 id="atlas-star-title" tabIndex={-1}>
            {preview ? profile.label + '主題星圖' : '我的' + profile.label}
          </h3>
        </div>
        <span>{ids.length} 門課程</span>
      </header>
      <p className="ca-star-hint">
        {preview ? '這是目前年級範圍的主題課程，不是你的收藏。' : '已依你的收藏自動排列。'}
        點亮的星點可以查看課程，不用畫線或拖曳。
      </p>
      <div
        className="ca-star-chart"
        role="group"
        aria-label={`${preview ? '主題' : '我的'}${profile.label}課程星圖`}
      >
        <svg viewBox="0 0 1000 1250" preserveAspectRatio="none" aria-hidden="true">
          {profile.edges.map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={profile.points[a][0] * 1000}
              y1={profile.points[a][1] * 1250}
              x2={profile.points[b][0] * 1000}
              y2={profile.points[b][1] * 1250}
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
              key={slot.index}
              type="button"
              className="ca-star"
              id={`atlas-star-${profile.id}-${slot.index}`}
              data-constellation-slot={slot.index}
              data-star-ids={slot.courses.map((course) => course.id).join(',')}
              ref={(node) => {
                if (node) stars.current.set(slot.index, node)
                else stars.current.delete(slot.index)
              }}
              style={{ left: `${slot.x * 100}%`, top: `${slot.y * 100}%` }}
              aria-label={`星點 ${slot.index + 1}，${slot.courses.length} 門課程：${slot.courses.map((course) => course.name).join('、')}`}
              aria-expanded={slot.courses.length > 1 ? group === slot.index : undefined}
              aria-controls={
                slot.courses.length > 1 && group === slot.index ? 'atlas-star-group' : undefined
              }
              onClick={(event) => {
                if (slot.courses.length === 1) onCourse(slot.courses[0].id, event.currentTarget)
                else setGroup(slot.index)
              }}
            >
              <span className="ca-star-core" aria-hidden="true" />
              <span className="ca-star-number" aria-hidden="true">
                {String(slot.index + 1).padStart(2, '0')}
              </span>
              {slot.courses.length > 1 && (
                <span className="ca-star-badge" aria-hidden="true">
                  {slot.courses.length}
                </span>
              )}
            </button>
          ))}
      </div>
      <p className="ca-star-hint">
        {ids.length > profile.points.length
          ? '同一星點包含多門課程，點按可展開。全部課程仍保留在下方分頁清單。'
          : '暗點只是固定造型，不是待解鎖課程；不用集滿也能擁有自己的星圖。'}
      </p>
      <p className="ca-star-hint">
        藝術化造型，非精確天文星位。連線不代表先修、正式修課安排或人格測驗。
      </p>
      {grouped && grouped.courses.length > 0 && (
        <section
          className="ca-star-group"
          id="atlas-star-group"
          aria-labelledby="atlas-star-group-title"
        >
          <div className="ca-star-heading">
            <h4 id="atlas-star-group-title" ref={groupTitle} tabIndex={-1}>
              星點 {grouped.index + 1} · {grouped.courses.length} 門課程
            </h4>
            <Button onClick={closeGroup}>收合星點清單</Button>
          </div>
          <ul>
            {grouped.courses.map((course) => (
              <li key={course.id}>
                <button
                  type="button"
                  className="ca-star-course"
                  data-star-course={course.id}
                  onClick={(event) => onCourse(course.id, event.currentTarget)}
                >
                  {course.name}
                  <span aria-hidden="true"> ↗</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </section>
  )
}

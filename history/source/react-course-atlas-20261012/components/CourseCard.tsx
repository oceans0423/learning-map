import type { CSSProperties } from 'react'
import { ROLES_BY_ID } from '../config/roles'
import { TRACKS } from '../config/tracks'
import type { Course } from '../types/course'

interface CourseCardProps {
  course: Course
  onSelect: (course: Course) => void
  highlighted?: boolean
  dimmed?: boolean
}

export function CourseCard({
  course,
  onSelect,
  highlighted = false,
  dimmed = false,
}: CourseCardProps) {
  const role = ROLES_BY_ID[course.role]
  const track = TRACKS.find((item) => item.name === course.primaryTrack)
  const style = {
    '--role-accent': role.visual.accent,
    '--role-soft': role.visual.soft,
    ...(track
      ? { '--track-accent': track.visual.accent, '--track-soft': track.visual.soft }
      : {}),
  } as CSSProperties
  const requirement = course.type === 'required' ? '必修' : '選修'
  const semester = course.semester === 1 ? '上學期' : '下學期'
  const yearLabel = ['大一', '大二', '大三', '大四'][course.year - 1]

  return (
    <button
      className={`course-card${highlighted ? ' is-highlighted' : ''}${dimmed ? ' is-dimmed' : ''}`}
      style={style}
      data-course-id={course.id}
      type="button"
      aria-label={`${course.name}，${requirement}，${yearLabel}，${semester}，${course.credits} 學分，${role.label}`}
      onClick={() => onSelect(course)}
    >
      <span className="course-card-title">{course.name}</span>
      <span className="course-card-arrow" aria-hidden="true">
        ↗
      </span>
      <span className="course-card-badges">
        <span className={`requirement-badge ${course.type}`}>{requirement}</span>
        <span className="role-badge">{role.label}</span>
      </span>
      <span className="course-card-meta">
        {semester} <i aria-hidden="true">·</i> {course.credits} 學分
      </span>
      {track && <span className="course-track-label">{track.name}</span>}
      <span className="course-card-discover">
        {highlighted ? '相關課程 · ' : ''}查看課程 <span aria-hidden="true">→</span>
      </span>
    </button>
  )
}

import { useRef, useState } from 'react'
import type { Course } from '../types/course'
import { searchCourses } from '../lib/search'
import { Button } from './Button'
interface Props {
  courses: readonly Course[]
  query: string
  onQuery: (query: string) => void
  showResults: boolean
  onCourse: (course: Course) => void
  onAll: () => void
}
export function CourseSearch({ courses, query, onQuery, showResults, onCourse, onAll }: Props) {
  const [draft, setDraft] = useState(query)
  const composing = useRef(false)
  const matches = searchCourses(courses, query)
  const clear = () => {
    setDraft('')
    onQuery('')
  }
  return (
    <section className="wb-search" aria-label="全域課名搜尋">
      <label htmlFor="course-search">搜尋所有課程</label>
      <div className="wb-search-controls">
        <input
          id="course-search"
          type="search"
          placeholder="試試課名、IP、文化…"
          value={draft}
          onCompositionStart={() => {
            composing.current = true
          }}
          onCompositionEnd={(event) => {
            composing.current = false
            onQuery(event.currentTarget.value)
          }}
          onChange={(event) => {
            setDraft(event.target.value)
            if (!composing.current) onQuery(event.target.value)
          }}
          aria-describedby="search-scope"
        />
        <Button onClick={clear}>清除搜尋</Button>
      </div>
      <p id="search-scope">搜尋全部 69 門課名，不受目前年級、學期或探索訊號限制。</p>
      {query.trim() && (
        <p className="wb-search-count" role="status">
          找到 {matches.length} 門課程
        </p>
      )}
      {showResults &&
        query.trim() &&
        (matches.length ? (
          <ul className="wb-search-results">
            {matches.map((course) => (
              <li key={course.id}>
                <Button data-search-id={course.id} onClick={() => onCourse(course)}>
                  {course.name}
                  <span>
                    大{['一', '二', '三', '四'][course.year - 1]} ·{' '}
                    {course.semester === 1 ? '上' : '下'}學期 · 查看課程
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p>
            沒有找到符合的課名。<Button onClick={clear}>清除關鍵字</Button>
            <Button
              onClick={() => {
                clear()
                onAll()
              }}
            >
              查看全部課程
            </Button>
          </p>
        ))}
    </section>
  )
}

import { useEffect, useRef } from 'react'
import type { Course } from '../types/course'
import { ROLES_BY_ID } from '../config/roles'

interface CourseDetailsDialogProps {
  course: Course
  onClose: () => void
}

export function CourseDetailsDialog({ course, onClose }: CourseDetailsDialogProps) {
  const panelRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previousFocus = document.activeElement
    returnFocusRef.current =
      previousFocus instanceof HTMLElement && previousFocus !== document.body
        ? previousFocus
        : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus({ preventScroll: true })

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) {
        event.preventDefault()
        panelRef.current?.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !panelRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault()
        last.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last || !panelRef.current?.contains(document.activeElement))
      ) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (returnFocusRef.current?.isConnected)
        returnFocusRef.current.focus({ preventScroll: true })
    }
  }, [])

  const role = ROLES_BY_ID[course.role]
  const hasApprovedDetails =
    course.verification.summary === 'approved' ||
    course.verification.activities === 'approved' ||
    course.verification.possibleOutputs === 'approved'

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="detail-panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-detail-title"
      >
        <header className="detail-header">
          <div>
            <p className="detail-kicker">FIELD NOTES / 課程探索筆記</p>
            <p className="eyebrow">
              {course.type === 'required' ? '必修課程' : '選修課程'} · {role.label}
            </p>
            <h2 className="display-type" id="course-detail-title">
              {course.name}
            </h2>
          </div>
          <button
            className="detail-close"
            ref={closeButtonRef}
            type="button"
            aria-label="關閉課程詳情"
            onClick={onClose}
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <dl className="detail-facts">
          <div>
            <dt>年級</dt>
            <dd>{['', '大一', '大二', '大三', '大四'][course.year]}</dd>
          </div>
          <div>
            <dt>學期</dt>
            <dd>{course.semester === 1 ? '上學期' : '下學期'}</dd>
          </div>
          <div>
            <dt>學分</dt>
            <dd>{course.credits} 學分</dd>
          </div>
          <div>
            <dt>修別</dt>
            <dd>{course.type === 'required' ? '必修' : '選修'}</dd>
          </div>
        </dl>

        <div className="detail-body">
          <section className="detail-section">
            <h3>在四年中的位置</h3>
            <p>
              這門課是四年課程規劃中的{role.label}課程，讓學習逐步延伸至不同探索面向與實作成果。
            </p>
          </section>
          <section className="detail-section">
            <h3>探索面向</h3>
            {course.primaryTrack && (
              <p>
                <span className="detail-field-label">主要面向</span>
                {course.primaryTrack}
              </p>
            )}
            {course.relatedTracks.length > 0 && (
              <p>
                <span className="detail-field-label">相關面向</span>
                {course.relatedTracks.join('、')}
              </p>
            )}
            {!course.primaryTrack && course.relatedTracks.length === 0 && (
              <p>未指定探索面向，仍完整保留於四年課程地圖。</p>
            )}
          </section>
          {hasApprovedDetails ? (
            <>
              {course.verification.summary === 'approved' && course.summary && (
                <section className="detail-section">
                  <h3>課程簡介</h3>
                  <p>{course.summary}</p>
                </section>
              )}
              {course.verification.activities === 'approved' &&
                course.activities.length > 0 && (
                  <section className="detail-section">
                    <h3>學習活動</h3>
                    <ul>
                      {course.activities.map((activity) => (
                        <li key={activity}>{activity}</li>
                      ))}
                    </ul>
                  </section>
                )}
              {course.verification.possibleOutputs === 'approved' &&
                course.possibleOutputs.length > 0 && (
                  <section className="detail-section">
                    <h3>可能產出</h3>
                    <ul>
                      {course.possibleOutputs.map((output) => (
                        <li key={output}>{output}</li>
                      ))}
                    </ul>
                  </section>
                )}
            </>
          ) : (
            <p className="details-pending">
              課程詳細說明整理中，實際內容請依當學年度課表及課程大綱為準。
            </p>
          )}
        </div>

        <footer className="detail-footer">
          <p>{course.offeringNote}</p>
          <p>課程說明以當年度課程大綱為準。</p>
        </footer>
      </section>
    </div>
  )
}

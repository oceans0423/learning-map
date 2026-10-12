import type { Course } from '../types/course'
/** The UI only consumes this projection, never unapproved draft detail text. */
export function publishedDetails(course: Course) {
  return {
    summary: course.verification.summary === 'approved' ? course.summary : null,
    activities: course.verification.activities === 'approved' ? course.activities : [],
    outputs: course.verification.possibleOutputs === 'approved' ? course.possibleOutputs : [],
    pending: [
      course.verification.summary,
      course.verification.activities,
      course.verification.possibleOutputs,
    ].some((status) => status !== 'approved'),
  }
}

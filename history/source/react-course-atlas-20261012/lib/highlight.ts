import type { FocusId } from '../config/focus'
import { TRACKS, type TrackId } from '../config/tracks'
import type { Course } from '../types/course'

/** Whether a course matches any active structure focus (OR semantics). */
export function isCourseHighlighted(course: Course, selected: readonly FocusId[]): boolean {
  if (selected.length === 0) return false

  return selected.some((focus) => {
    if (focus === 'foundation' || focus === 'integration') return course.role === focus
    const trackName = trackNameById[focus]
    return course.primaryTrack === trackName || course.relatedTracks.includes(trackName)
  })
}

const trackNameById = Object.fromEntries(
  TRACKS.map((track) => [track.id, track.name]),
) as Record<TrackId, (typeof TRACKS)[number]['name']>

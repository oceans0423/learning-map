import type { Role } from '../config/roles'
import type { TrackName } from '../config/tracks'

export type CourseType = 'required' | 'elective'

export const MODULES = ['人文思維與方法', '數位人文', '文化創意與社會設計', '文學創作'] as const
export type ModuleName = (typeof MODULES)[number]

export type VerificationStatus = 'approved' | 'draft'

export interface Verification {
  basic: VerificationStatus
  role: VerificationStatus
  tracks: VerificationStatus
  module: VerificationStatus
  summary: VerificationStatus
  activities: VerificationStatus
  possibleOutputs: VerificationStatus
}

// 對應 courses.json 單筆格式（PRD §8.2）
export interface Course {
  id: string
  name: string
  sourceName: string
  year: 1 | 2 | 3 | 4
  semester: 1 | 2
  credits: number
  type: CourseType
  role: Role
  module: ModuleName
  primaryTrack: TrackName | null
  relatedTracks: TrackName[]
  subTags: string[]
  summary: string | null
  activities: string[]
  possibleOutputs: string[]
  offeringNote: string
  sourceVersion: string
  verification: Verification
}

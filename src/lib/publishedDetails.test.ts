import { it, expect } from 'vitest'
import { courses } from '../data/courses'
import { publishedDetails } from './publishedDetails'
it('never publishes draft text even when populated, and gates each field independently', () => {
  const source = {
    ...courses[0],
    summary: 'DRAFT SECRET',
    activities: ['ACTIVITY SECRET'],
    possibleOutputs: ['OUTPUT SECRET'],
  }
  expect(publishedDetails(source)).toEqual({
    summary: null,
    activities: [],
    outputs: [],
    pending: true,
  })
  expect(
    publishedDetails({
      ...source,
      verification: { ...source.verification, summary: 'approved' },
    }),
  ).toEqual({ summary: 'DRAFT SECRET', activities: [], outputs: [], pending: true })
  expect(
    publishedDetails({
      ...source,
      verification: {
        ...source.verification,
        activities: 'approved',
        possibleOutputs: 'approved',
      },
    }),
  ).toEqual({
    summary: null,
    activities: ['ACTIVITY SECRET'],
    outputs: ['OUTPUT SECRET'],
    pending: true,
  })
})

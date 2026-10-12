import { describe, expect, it } from 'vitest'
import css from '../styles/constellation-tokens.css?raw'
import { contrastRatio } from './contrast'
const token = (name: string) => {
  const value = css.match(new RegExp(name + ': (#[0-9a-f]{6})', 'i'))?.[1]
  if (!value) throw new Error('Missing token ' + name)
  return value
}
describe('UI color contrast', () => {
  it('keeps body, secondary text and all signal names readable on both surfaces', () => {
    for (const name of [
      '--ui-text',
      '--ui-text-secondary',
      '--signal-text',
      '--signal-story',
      '--signal-digital',
      '--signal-field',
      '--ui-error',
    ]) {
      expect(contrastRatio(token(name), token('--ui-night')), name).toBeGreaterThanOrEqual(4.5)
    }
    for (const name of [
      '--ui-ink',
      '--ui-ink-secondary',
      '--signal-text-ink',
      '--signal-story-ink',
      '--signal-digital-ink',
      '--signal-field-ink',
      '--ui-error-on-paper',
    ]) {
      expect(contrastRatio(token(name), token('--ui-paper')), name).toBeGreaterThanOrEqual(4.5)
    }
  })
  it('keeps focus and necessary control boundaries visible', () => {
    expect(contrastRatio(token('--ui-focus'), token('--ui-night'))).toBeGreaterThanOrEqual(3)
    expect(
      contrastRatio(token('--ui-focus-on-paper'), token('--ui-paper')),
    ).toBeGreaterThanOrEqual(3)
    expect(contrastRatio(token('--ui-line'), token('--ui-night'))).toBeGreaterThanOrEqual(3)
  })
})

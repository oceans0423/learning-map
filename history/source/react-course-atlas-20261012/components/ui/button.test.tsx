import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Button } from './button'

describe('shadcn Button', () => {
  it('renders a native disabled button', () => {
    const html = renderToStaticMarkup(<Button disabled>Explore</Button>)
    expect(html).toContain('<button')
    expect(html).toContain('disabled=""')
    expect(html).toContain('data-slot="button"')
    expect(html).toContain('Explore')
  })

  it('allows prefixed class overrides', () => {
    const html = renderToStaticMarkup(<Button className="tw:h-10">Explore</Button>)
    expect(html).toContain('tw:h-10')
    expect(html).not.toContain('tw:h-9')
  })

  it('supports a link through asChild', () => {
    const html = renderToStaticMarkup(
      <Button asChild variant="outline">
        <a href="#courses">Courses</a>
      </Button>,
    )
    expect(html).toContain('<a ')
    expect(html).toContain('href="#courses"')
    expect(html).not.toContain('<button')
  })
})

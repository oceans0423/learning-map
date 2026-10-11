import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import { Button } from '../../../src/components/ui/button'
import '../../../src/styles/shadcn.css'
import '../../../src/styles/expedition.css'

flushSync(() => {
  createRoot(document.getElementById('root')!).render(
    <main className="tw:flex tw:flex-col tw:items-start tw:gap-4 tw:p-6">
      <h1>shadcn Button integration check</h1>
      <Button id="default">Default</Button>
      <Button id="outline" variant="outline">
        Outline
      </Button>
      <Button id="disabled" disabled>
        Disabled
      </Button>
      <Button id="override" className="tw:h-10">
        Height override
      </Button>
      <Button asChild variant="secondary">
        <a href="#result">Link</a>
      </Button>
      <output id="result" />
    </main>,
  )
})

await document.fonts.ready
const style = (id: string) => getComputedStyle(document.getElementById(id)!)
const checks = {
  // A flex parent's inline-flex child is blockified to flex by the browser.
  utilityDisplay: style('default').display === 'flex',
  defaultHeight: style('default').height === '36px',
  defaultBorder: style('default').borderTopWidth === '0px',
  overrideHeight: style('override').height === '40px',
  disabledOpacity: style('disabled').opacity === '0.5',
  disabledPointerEvents: style('disabled').pointerEvents === 'none',
  outlineBorder: style('outline').borderTopWidth === '1px',
  outlineColor: style('outline').color !== style('default').color,
  themeBackground: style('default').backgroundColor !== 'rgba(0, 0, 0, 0)',
}
document.getElementById('result')!.textContent = JSON.stringify(checks, null, 2)
if (Object.values(checks).some((passed) => !passed)) {
  throw new Error(`shadcn style integration failed: ${JSON.stringify(checks)}`)
}

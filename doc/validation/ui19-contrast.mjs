/* global process, console, document, URL, getComputedStyle */
import { createRequire } from 'node:module'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const { chromium } = createRequire(import.meta.url)(process.argv[2]), browser = await chromium.launch({ channel: 'chrome' })
const linear = c => { const s = c / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4 }
const lum = rgb => rgb.map(linear).reduce((s, c, i) => s + c * [.2126,.7152,.0722][i], 0)
const contrast = (a,b) => { const l = [lum(a),lum(b)].sort((x,y) => x-y); return (l[1]+.05)/(l[0]+.05) }
const report = { browser: browser.version(), screens: [] }
try {
  for (const width of [390,1440]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' }); await page.goto('http://127.0.0.1:5182/'); await page.getByRole('button', { name: '所有課程', exact: true }).click()
    for (let i = 0; i < 8; i++) { await page.locator('[data-list-id]').nth(i).click(); await page.locator('.collection-toggle').click(); await page.getByRole('button', { name: '關閉課程詳情' }).click(); await page.waitForFunction(() => !document.querySelector('.detail-panel')) }
    await page.getByRole('button', { name: '我的星座（選用）' }).click()
    await page.getByRole('button', { name: '移動模式', exact: true }).click()
    const data = await page.evaluate(() => {
      const rgba = value => { const n = value.match(/[\d.]+/g)?.map(Number) ?? [0,0,0,0]; return [n[0],n[1],n[2],n[3] ?? 1] }
      const background = e => {
        if (!e) return [16,38,48]
        const prior = background(e.parentElement), color = rgba(getComputedStyle(e).backgroundColor)
        let result = color.slice(0,3).map((c,i) => c*color[3]+prior[i]*(1-color[3]))
        // The actual canvas gradient's most opaque stop is #22444e66.
        if (e.classList.contains('constellation-canvas')) result = [34,68,78].map((c,i) => c*.4+result[i]*.6)
        return result
      }
      return [...document.querySelectorAll('.constellation-editor *, .personal-storage-controls *')].filter(e => e.getClientRects().length && getComputedStyle(e).visibility === 'visible' && !e.closest('button:disabled') && [...e.childNodes].some(n => n.nodeType === 3 && /[a-z0-9\u3400-\u9fff]/i.test(n.textContent))).map(e => { const css = getComputedStyle(e); return { text: e.textContent.trim().slice(0,60), color: rgba(css.color).slice(0,3), background: background(e), size: parseFloat(css.fontSize), weight: parseInt(css.fontWeight)||400 } })
    })
    const readings = data.map(item => ({ ...item, ratio: contrast(item.color,item.background), required: item.size>=24 || (item.size>=18.66 && item.weight>=700) ? 3 : 4.5 }))
    const violations = readings.filter(r => r.ratio < r.required)
    const graphical = await page.locator('.constellation-canvas').evaluate(e => { const css = getComputedStyle(e.querySelector('polyline')); return css.stroke.match(/[\d.]+/g).map(Number).slice(0,3) })
    const lineRatio = contrast(graphical, [23.2,50,60])
    report.screens.push({ width, readings, violations, lineRatio, gradientBound: 'Actual alpha-composited brightest stop #22444e66 over #102630' })
    if (violations.length || lineRatio < 3) throw new Error(JSON.stringify({ violations, lineRatio }))
    await page.getByRole('button', { name: '取消移動', exact: true }).click()
    await page.locator('.constellation-art').scrollIntoViewIfNeeded(); await page.screenshot({ path: fileURLToPath(new URL(`./ui19-20261009/${width}-editor.png`,import.meta.url)), fullPage: true, animations: 'disabled' }); await page.close()
  }
} finally { await writeFile(fileURLToPath(new URL('./ui19-20261009/contrast.json',import.meta.url)), JSON.stringify(report,null,2)); await browser.close() }
console.log(JSON.stringify({ browser: report.browser, textReadings: report.screens.map(s => s.readings.length), lines: report.screens.map(s => s.lineRatio) }))

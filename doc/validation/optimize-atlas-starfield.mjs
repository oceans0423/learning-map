/* global process, console, document, Image */
import { createRequire } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { URL } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require(process.argv[2])
const source = new URL(
  '../../public/images/backgrounds/minimal-deep-blue-starfield.png',
  import.meta.url,
)
const input = await readFile(source)
const hash = (data) => createHash('sha256').update(data).digest('hex')
const browser = await chromium.launch({ channel: 'chrome' })
try {
  const page = await browser.newPage()
  const result = await page.evaluate(async (data) => {
    const image = new Image()
    image.src = `data:image/png;base64,${data}`
    await image.decode()
    const versions = [1600, 800].map((maximum) => {
      const canvas = document.createElement('canvas')
      canvas.width = Math.min(image.naturalWidth, maximum)
      canvas.height = Math.round((image.naturalHeight * canvas.width) / image.naturalWidth)
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
      return {
        width: canvas.width,
        height: canvas.height,
        webp: canvas.toDataURL('image/webp', 0.92),
      }
    })
    return { width: image.naturalWidth, height: image.naturalHeight, versions }
  }, input.toString('base64'))
  const manifest = {
    source: {
      width: result.width,
      height: result.height,
      bytes: input.length,
      sha256: hash(input),
    },
    outputs: [],
  }
  for (const [index, version] of result.versions.entries()) {
    if (!version.webp.startsWith('data:image/webp;'))
      throw new Error('WebP encoder unavailable')
    const data = Buffer.from(version.webp.split(',')[1], 'base64')
    const name = `minimal-deep-blue-starfield-${index === 0 ? 'desktop' : 'mobile'}.webp`
    await writeFile(new URL(`../../public/images/backgrounds/${name}`, import.meta.url), data)
    manifest.outputs.push({
      name,
      width: version.width,
      height: version.height,
      bytes: data.length,
      sha256: hash(data),
    })
  }
  if (hash(await readFile(source)) !== manifest.source.sha256)
    throw new Error('Original image changed')
  await writeFile(
    new URL('./course-atlas-v2-20261009/background-assets.json', import.meta.url),
    JSON.stringify(manifest, null, 2),
  )
  console.log(JSON.stringify(manifest))
} finally {
  await browser.close()
}

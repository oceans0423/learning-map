/* global process, console, document, Image */
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Buffer } from 'node:buffer'
import { URL } from 'node:url'

const require = createRequire(import.meta.url)
const { chromium } = require(process.argv[2])
const stems = [
  'humanities-thinking',
  'narrative-creation',
  'digital-humanities',
  'cultural-social-design',
]
const directory = new URL('./area-illustrations-20261009/', import.meta.url)
await mkdir(directory, { recursive: true })
const hash = (data) => createHash('sha256').update(data).digest('hex')
const browser = await chromium.launch({ channel: 'chrome' })
const manifest = []
try {
  const page = await browser.newPage()
  for (const stem of stems) {
    const source = new URL(`../../public/images/areas/${stem}.png`, import.meta.url)
    const input = await readFile(source)
    const result = await page.evaluate(async (data) => {
      const image = new Image()
      image.src = `data:image/png;base64,${data}`
      await image.decode()
      const versions = [384, 768].map((maximum) => {
        const canvas = document.createElement('canvas')
        canvas.width = Math.min(image.naturalWidth, maximum)
        canvas.height = Math.round((image.naturalHeight * canvas.width) / image.naturalWidth)
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
        return {
          width: canvas.width,
          height: canvas.height,
          webp: canvas.toDataURL('image/webp', 0.9),
        }
      })
      return { width: image.naturalWidth, height: image.naturalHeight, versions }
    }, input.toString('base64'))
    const entry = {
      source: {
        name: `${stem}.png`,
        width: result.width,
        height: result.height,
        bytes: input.length,
        sha256: hash(input),
      },
      outputs: [],
    }
    for (const version of result.versions) {
      if (!version.webp.startsWith('data:image/webp;'))
        throw new Error('WebP encoder unavailable')
      const data = Buffer.from(version.webp.split(',')[1], 'base64')
      const name = `${stem}-${version.width}.webp`
      await writeFile(new URL(`../../public/images/areas/${name}`, import.meta.url), data)
      entry.outputs.push({
        name,
        width: version.width,
        height: version.height,
        bytes: data.length,
        sha256: hash(data),
      })
    }
    if (hash(await readFile(source)) !== entry.source.sha256)
      throw new Error(`Original changed: ${stem}`)
    manifest.push(entry)
  }
  await writeFile(new URL('assets.json', directory), `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(JSON.stringify(manifest))
} finally {
  await browser.close()
}

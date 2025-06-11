// @ts-check
import puppeteer from 'puppeteer'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ANIMATION_FRAMES = 30  // 1/2 second

const outputDir = path.join(__dirname, '..', 'screenshots')
await fs.mkdir(outputDir, { recursive: true })
const URL = 'https://nolaai.webflow.io/'

const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2 // Retina-like quality
    }
})

const page = await browser.newPage()

// Navigate to your website
await page.goto(URL, { waitUntil: 'networkidle0' })

// reload
await page.reload()

// rm cookie thing
await page.click('.fs-cc-banner__button.w-button')

// webflow badge
await page.evaluate(() => {
    const badge = document.querySelector('.w-webflow-badge')
    if (badge) badge.remove()

    const interval = setInterval(() => {
        const badge = document.querySelector('.w-webflow-badge')
        if (badge) badge.remove()
    }, 100)

    setTimeout(() => clearInterval(interval), 30000)
})

// wait for the animation 2 seconds
await intro()

// scrolling
// Calculate total scrollable height
const totalScrollHeight = await page.evaluate(() => document.body.scrollHeight)

const scrollStep = 5  // pixels per frame
let scrollPosition = 0
let frame = ANIMATION_FRAMES  // start at frame 30 (1/2 second) b/c the intro

const startTime = Date.now()

// Main loop
while (scrollPosition < totalScrollHeight) {
    // Scroll
    await page.evaluate((scrollY) => {
        window.scrollTo(0, scrollY)
    }, scrollPosition)

    // Save screenshot
    const filePath = /** @type {(`${string}.png`)} */(path.join(
        outputDir,
        `frame_${('' + frame).padStart(4, '0')}.png`
    ))
    await page.screenshot({
        path: filePath,
        type: 'png',
        fullPage: false,
        omitBackground: false
    })

    scrollPosition += scrollStep
    frame++

    // Try to stay on a ~16.67ms (60fps) interval
    const elapsed = Date.now() - startTime
    const targetTime = frame * (1000 / 60)
    const sleepTime = targetTime - elapsed

    if (sleepTime > 0) {
        await new Promise(resolve => setTimeout(resolve, sleepTime))
    }
}

await browser.close()

// take some screenshots before scrolling
// Take 60 screenshots, one every 1/60th of a second (for 1 second)
async function intro () {
    for (let frame = 0; frame < ANIMATION_FRAMES; frame++) {
        const filePath = /** @type {(`${string}.png`)} */(path.join(
            outputDir,
            `frame_${String(frame).padStart(4, '0')}.png`
        ))
        await page.screenshot({
            path: filePath,
            type: 'png',
            fullPage: false,
            omitBackground: false
        })
        // Wait for 1/60th of a second
        if (frame < ANIMATION_FRAMES - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 / 60))
        }
    }
}

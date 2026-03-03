/**
 * Playwright screenshot script for shadcn-calendar-planner README.
 *
 * Requires dev server running on http://localhost:3099
 *
 * Usage:  node scripts/screenshots.mjs
 */

import { chromium } from "@playwright/test"

const BASE = "http://localhost:3099"
const OUT = "assets/screenshots"
const VIEWPORT = { width: 1440, height: 900 }

async function main() {
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: "light",
  })

  console.log("\n📸 Capturing screenshots…\n")

  // ── Helper: fresh page per screenshot avoids stale state ──
  async function shot(name, fn) {
    const page = await context.newPage()
    await page.goto(BASE, { waitUntil: "networkidle" })
    await page.waitForTimeout(1200)
    if (fn) await fn(page)
    await page.waitForTimeout(1000)
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false })
    console.log(`  ✓ ${name}.png`)
    await page.close()
  }

  // Toolbar view toggles are Radix ToggleGroup items (exact text).
  // Tab triggers contain composite text like "Month / Week / Day".
  // We target data-radix-group buttons with regex for exact match.

  // 1. Month view (default)
  await shot("01-month-view")

  // 2. Week view
  await shot("02-week-view", async (page) => {
    const btn = page.locator('[data-radix-group] button', { hasText: /^Week$/ }).first()
    if (await btn.count() > 0) await btn.click()
    else await page.getByRole("radio", { name: "Week", exact: true }).click()
    await page.waitForTimeout(800)
  })

  // 3. Day view
  await shot("03-day-view", async (page) => {
    const btn = page.locator('[data-radix-group] button', { hasText: /^Day$/ }).first()
    if (await btn.count() > 0) await btn.click()
    else await page.getByRole("radio", { name: "Day", exact: true }).click()
    await page.waitForTimeout(800)
  })

  // 4. Event popover — day view, click first event
  await shot("04-event-popover", async (page) => {
    const dayBtn = page.locator('[data-radix-group] button', { hasText: /^Day$/ }).first()
    if (await dayBtn.count() > 0) await dayBtn.click()
    await page.waitForTimeout(1000)
    const evt = page.locator(".truncate.cursor-pointer").first()
    if (await evt.count() > 0) {
      await evt.click()
      await page.waitForTimeout(1000)
    }
  })

  // 5. Resource Groups tab
  await shot("05-resource-groups", async (page) => {
    await page.getByRole("tab", { name: "Resource Groups" }).click()
    await page.waitForTimeout(1200)
  })

  // 6. Agenda tab
  await shot("06-agenda-view", async (page) => {
    await page.getByRole("tab", { name: "Agenda" }).click()
    await page.waitForTimeout(1200)
  })

  // 7. Dense Week tab
  await shot("07-dense-week", async (page) => {
    await page.getByRole("tab", { name: "Dense Week" }).click()
    await page.waitForTimeout(1200)
  })

  // 8. Zoom in — week view with finer time slots
  await shot("08-zoom-in", async (page) => {
    // Switch to week view (use same fallback as shot 02)
    const btn = page.locator('[data-radix-group] button', { hasText: /^Week$/ }).first()
    if (await btn.count() > 0) {
      await btn.click()
    } else {
      // Fallback: Radix ToggleGroup type=single renders role=radio
      await page.getByRole("radio", { name: "Week", exact: true }).click()
    }
    await page.waitForTimeout(800)
    // Click zoom in button 3x for very fine slots
    const zoomIn = page.locator('button[aria-label="Zoom in"]')
    for (let i = 0; i < 3; i++) {
      if (await zoomIn.count() > 0) {
        await zoomIn.click()
        await page.waitForTimeout(400)
      }
    }
  })

  // 9. Dark mode
  const darkCtx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    colorScheme: "dark",
  })
  const darkPage = await darkCtx.newPage()
  await darkPage.goto(BASE, { waitUntil: "networkidle" })
  await darkPage.evaluate(() => document.documentElement.classList.add("dark"))
  await darkPage.waitForTimeout(2000)
  await darkPage.screenshot({ path: `${OUT}/09-dark-mode.png`, fullPage: false })
  console.log("  ✓ 09-dark-mode.png")
  await darkPage.close()
  await darkCtx.close()

  console.log(`\n✅ All screenshots saved to ${OUT}/\n`)

  await browser.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'

export async function GET(request: NextRequest) {
  try {
    console.log('Test screenshot endpoint - starting browser...')
    
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080'
      ],
      headless: true,
      timeout: 30000,
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    })
    
    console.log('Browser launched successfully')
    
    const page = await browser.newPage()
    await page.goto('https://example.com', { waitUntil: 'networkidle2' })
    
    const screenshot = await page.screenshot({ type: 'png' })
    await browser.close()
    
    console.log('Screenshot taken successfully, size:', screenshot.length)
    
    return new NextResponse(Buffer.from(screenshot), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="test.png"'
      }
    })
  } catch (error) {
    console.error('Test screenshot error:', error)
    return NextResponse.json({ 
      error: 'Screenshot failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
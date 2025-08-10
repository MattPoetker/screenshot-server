import path from 'path'
import fs from 'fs'

// Match the original Express.js implementation
// This is where lsyncd picks up files to sync to images.sitelaunch.io
export const IMAGES_DIR = process.env.IMAGES_DIR || '/var/www/screenshots'

// Ensure the images directory exists
export function ensureImagesDir() {
  try {
    if (!fs.existsSync(IMAGES_DIR)) {
      fs.mkdirSync(IMAGES_DIR, { recursive: true })
    }
  } catch (error) {
    console.error('Failed to create images directory:', error)
    throw new Error(`Cannot access or create images directory: ${IMAGES_DIR}`)
  }
}

// Check if the directory is writable
export function checkImagesDir() {
  try {
    fs.accessSync(IMAGES_DIR, fs.constants.W_OK)
    return true
  } catch {
    return false
  }
}
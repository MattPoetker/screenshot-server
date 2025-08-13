import fs from 'fs/promises'
import path from 'path'
import { StorageService, StorageConfig, UploadResult, StorageMetadata } from './types'

export class LocalStorageService implements StorageService {
  private baseDir: string
  private publicUrl: string

  constructor(config: StorageConfig) {
    if (!config.local) {
      throw new Error('Local storage configuration is required')
    }
    this.baseDir = config.local.baseDir
    this.publicUrl = config.local.publicUrl
  }

  async upload(buffer: Buffer, filename: string, contentType: string): Promise<UploadResult> {
    try {
      // Ensure directory exists
      await fs.mkdir(this.baseDir, { recursive: true })
      
      const localPath = path.join(this.baseDir, filename)
      await fs.writeFile(localPath, buffer)
      
      const stats = await fs.stat(localPath)
      
      return {
        filename,
        localPath,
        storageUrl: localPath,
        publicUrl: this.getPublicUrl(filename),
        size: stats.size
      }
    } catch (error) {
      console.error('Local storage upload failed:', error)
      throw new Error(`Failed to upload file to local storage: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async download(filename: string): Promise<Buffer> {
    try {
      const localPath = path.join(this.baseDir, filename)
      return await fs.readFile(localPath)
    } catch (error) {
      console.error('Local storage download failed:', error)
      throw new Error(`Failed to download file from local storage: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async delete(filename: string): Promise<void> {
    try {
      const localPath = path.join(this.baseDir, filename)
      await fs.unlink(localPath)
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        // File doesn't exist, consider it already deleted
        return
      }
      console.error('Local storage delete failed:', error)
      throw new Error(`Failed to delete file from local storage: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async exists(filename: string): Promise<boolean> {
    try {
      const localPath = path.join(this.baseDir, filename)
      await fs.access(localPath)
      return true
    } catch {
      return false
    }
  }

  async getMetadata(filename: string): Promise<StorageMetadata | null> {
    try {
      const localPath = path.join(this.baseDir, filename)
      const stats = await fs.stat(localPath)
      
      return {
        contentType: this.getContentType(filename),
        size: stats.size,
        lastModified: stats.mtime
      }
    } catch {
      return null
    }
  }

  getPublicUrl(filename: string): string {
    return `${this.publicUrl.replace(/\/$/, '')}/${filename}`
  }

  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase()
    switch (ext) {
      case '.png':
        return 'image/png'
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg'
      case '.webp':
        return 'image/webp'
      case '.gif':
        return 'image/gif'
      default:
        return 'application/octet-stream'
    }
  }
}
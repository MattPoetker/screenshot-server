import { StorageService, StorageConfig } from './types'
import { LocalStorageService } from './LocalStorageService'
import { R2StorageService } from './R2StorageService'

export class StorageFactory {
  private static instance: StorageService | null = null

  static getInstance(): StorageService {
    if (!this.instance) {
      this.instance = this.createStorageService()
    }
    return this.instance
  }

  private static createStorageService(): StorageService {
    const config = this.getStorageConfig()
    
    switch (config.provider) {
      case 'r2':
        return new R2StorageService(config)
      case 'local':
      default:
        return new LocalStorageService(config)
    }
  }

  private static getStorageConfig(): StorageConfig {
    const provider = (process.env.STORAGE_PROVIDER as 'local' | 'r2') || 'local'
    
    if (provider === 'r2') {
      const requiredEnvVars = [
        'R2_ENDPOINT',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET_NAME',
        'R2_PUBLIC_URL'
      ]
      
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
      if (missingVars.length > 0) {
        console.warn(`Missing R2 environment variables: ${missingVars.join(', ')}. Falling back to local storage.`)
        return this.getLocalConfig()
      }

      return {
        provider: 'r2',
        r2: {
          endpoint: process.env.R2_ENDPOINT!,
          accessKeyId: process.env.R2_ACCESS_KEY_ID!,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
          bucket: process.env.R2_BUCKET_NAME!,
          region: process.env.R2_REGION || 'auto',
          publicUrl: process.env.R2_PUBLIC_URL!
        }
      }
    }

    return this.getLocalConfig()
  }

  private static getLocalConfig(): StorageConfig {
    return {
      provider: 'local',
      local: {
        baseDir: process.env.IMAGES_DIR || '/var/www/screenshots',
        publicUrl: process.env.LOCAL_PUBLIC_URL || 'https://images.sitelaunch.io/images'
      }
    }
  }

  // For testing or manual configuration
  static createService(config: StorageConfig): StorageService {
    switch (config.provider) {
      case 'r2':
        return new R2StorageService(config)
      case 'local':
      default:
        return new LocalStorageService(config)
    }
  }

  // Reset instance (useful for testing)
  static reset(): void {
    this.instance = null
  }
}
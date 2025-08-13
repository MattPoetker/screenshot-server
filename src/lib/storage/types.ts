export interface StorageConfig {
  provider: 'local' | 'r2'
  local?: {
    baseDir: string
    publicUrl: string
  }
  r2?: {
    endpoint: string
    accessKeyId: string
    secretAccessKey: string
    bucket: string
    region?: string
    publicUrl: string
  }
}

export interface UploadResult {
  filename: string
  localPath?: string
  storageUrl: string
  publicUrl: string
  size: number
}

export interface StorageMetadata {
  contentType: string
  size: number
  lastModified?: Date
  etag?: string
}

export interface StorageService {
  upload(buffer: Buffer, filename: string, contentType: string): Promise<UploadResult>
  download(filename: string): Promise<Buffer>
  delete(filename: string): Promise<void>
  exists(filename: string): Promise<boolean>
  getMetadata(filename: string): Promise<StorageMetadata | null>
  getPublicUrl(filename: string): string
}
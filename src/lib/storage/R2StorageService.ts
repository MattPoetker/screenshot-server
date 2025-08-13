import { 
  S3Client, 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand, 
  HeadObjectCommand 
} from '@aws-sdk/client-s3'
import { StorageService, StorageConfig, UploadResult, StorageMetadata } from './types'

export class R2StorageService implements StorageService {
  private s3Client: S3Client
  private bucket: string
  private publicUrl: string

  constructor(config: StorageConfig) {
    if (!config.r2) {
      throw new Error('R2 storage configuration is required')
    }

    const r2Config = config.r2
    this.bucket = r2Config.bucket
    this.publicUrl = r2Config.publicUrl

    this.s3Client = new S3Client({
      region: r2Config.region || 'auto',
      endpoint: r2Config.endpoint,
      credentials: {
        accessKeyId: r2Config.accessKeyId,
        secretAccessKey: r2Config.secretAccessKey,
      },
      // R2-specific configuration
      forcePathStyle: true,
    })
  }

  async upload(buffer: Buffer, filename: string, contentType: string): Promise<UploadResult> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: filename,
        Body: buffer,
        ContentType: contentType,
        // Optional: Set cache control headers
        CacheControl: 'public, max-age=31536000', // 1 year cache
      })

      await this.s3Client.send(command)

      return {
        filename,
        storageUrl: `s3://${this.bucket}/${filename}`,
        publicUrl: this.getPublicUrl(filename),
        size: buffer.length
      }
    } catch (error) {
      console.error('R2 storage upload failed:', error)
      throw new Error(`Failed to upload file to R2 storage: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async download(filename: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: filename,
      })

      const response = await this.s3Client.send(command)
      
      if (!response.Body) {
        throw new Error('No body in response')
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = []
      const stream = response.Body as any
      
      for await (const chunk of stream) {
        chunks.push(chunk)
      }
      
      return Buffer.concat(chunks)
    } catch (error) {
      console.error('R2 storage download failed:', error)
      throw new Error(`Failed to download file from R2 storage: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async delete(filename: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: filename,
      })

      await this.s3Client.send(command)
    } catch (error) {
      console.error('R2 storage delete failed:', error)
      throw new Error(`Failed to delete file from R2 storage: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async exists(filename: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: filename,
      })

      await this.s3Client.send(command)
      return true
    } catch (error) {
      if ((error && typeof error === 'object' && 'name' in error && error.name === 'NotFound') || 
          (error && typeof error === 'object' && '$metadata' in error && 
           error.$metadata && typeof error.$metadata === 'object' && 
           'httpStatusCode' in error.$metadata && error.$metadata.httpStatusCode === 404)) {
        return false
      }
      console.error('R2 storage exists check failed:', error)
      throw new Error(`Failed to check file existence in R2 storage: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  async getMetadata(filename: string): Promise<StorageMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: filename,
      })

      const response = await this.s3Client.send(command)

      return {
        contentType: response.ContentType || 'application/octet-stream',
        size: response.ContentLength || 0,
        lastModified: response.LastModified,
        etag: response.ETag
      }
    } catch (error) {
      if ((error && typeof error === 'object' && 'name' in error && error.name === 'NotFound') || 
          (error && typeof error === 'object' && '$metadata' in error && 
           error.$metadata && typeof error.$metadata === 'object' && 
           'httpStatusCode' in error.$metadata && error.$metadata.httpStatusCode === 404)) {
        return null
      }
      console.error('R2 storage metadata check failed:', error)
      throw new Error(`Failed to get file metadata from R2 storage: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  getPublicUrl(filename: string): string {
    return `${this.publicUrl.replace(/\/$/, '')}/${filename}`
  }
}
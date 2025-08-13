// Database types
export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'user'
  is_active: boolean
  email_verified: boolean
  email_verification_token?: string
  email_verification_expires?: string
  password_reset_token?: string
  password_reset_expires?: string
  created_at: string
  last_login?: string
  stripe_customer_id?: string
}

export interface ApiKey {
  id: number
  key_id: string
  name: string
  description?: string
  rate_limit: number
  is_active: boolean
  created_by: number
  expires_at?: string
  created_at: string
  updated_at: string
  raw_key?: string // Only available during creation
}

export interface Screenshot {
  id: number
  api_key_id: number
  url: string
  image_path: string
  format: 'png' | 'jpeg' | 'webp'
  width?: number
  height?: number
  success: boolean
  error_message?: string
  processing_time_ms?: number
  created_at: string
}

export interface UsageStats {
  id: number
  api_key_id: number
  date: string
  request_count: number
  success_count: number
  error_count: number
  total_processing_time_ms: number
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface DashboardStats {
  totalScreenshots: number
  activeApiKeys: number
  successRate: number
  avgProcessingTime: number
}

export interface CreateApiKeyRequest {
  name: string
  description?: string
  rate_limit?: number
  expires_at?: string
  created_by: number
}

export interface CreateApiKeyResponse {
  id: number
  key_id: string
  name: string
  raw_key: string
  rate_limit: number
  expires_at?: string
}

// NiceShot API types
export interface ScreenshotRequest {
  url: string
  format?: 'png' | 'jpeg' | 'webp' | 'gif'
  width?: number
  height?: number
  quality?: number
  fullPage?: boolean
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2'
  delay?: number
  timeout?: number
  
  // Device presets
  device?: string
  devicePixelRatio?: number
  userAgent?: string
  isMobile?: boolean
  hasTouch?: boolean
  
  // Advanced options
  cookies?: Array<{
    name: string
    value: string
    domain?: string
    path?: string
    expires?: number
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'Strict' | 'Lax' | 'None'
  }>
  headers?: Record<string, string>
  hideElements?: string[]
  blockResources?: string[]
  disableJavascript?: boolean
  disableImages?: boolean
  authentication?: {
    username: string
    password: string
  }
  
  // GIF-specific options (when format is gif)
  scrollSpeed?: number
  frameDuration?: number
  maxScrollHeight?: number
  scrollPause?: number
  gifFrameRate?: number
  highlightInteractions?: boolean
  scrollStep?: number
}

export interface ScreenshotResponse {
  image: string
  url: string
  metadata: {
    width: number
    height: number
    format: string
    size: number
    captureTime: string
    processingTime: number
    method: string
  }
}
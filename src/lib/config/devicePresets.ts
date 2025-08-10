export interface DevicePreset {
  name: string
  width: number
  height: number
  devicePixelRatio: number
  userAgent: string
  isMobile?: boolean
  hasTouch?: boolean
}

export const DEVICE_PRESETS: Record<string, DevicePreset> = {
  // Mobile devices
  mobile: {
    name: 'Mobile (Generic)',
    width: 375,
    height: 667,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  },
  
  iphone: {
    name: 'iPhone 12/13/14',
    width: 375,
    height: 812,
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  },

  'iphone-se': {
    name: 'iPhone SE',
    width: 375,
    height: 667,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  },

  'iphone-plus': {
    name: 'iPhone 8 Plus',
    width: 414,
    height: 736,
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  },

  'iphone-pro-max': {
    name: 'iPhone 14 Pro Max',
    width: 430,
    height: 932,
    devicePixelRatio: 3,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true
  },

  // Android devices
  'pixel-5': {
    name: 'Google Pixel 5',
    width: 393,
    height: 851,
    devicePixelRatio: 2.75,
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
    isMobile: true,
    hasTouch: true
  },

  'galaxy-s21': {
    name: 'Samsung Galaxy S21',
    width: 384,
    height: 854,
    devicePixelRatio: 2.81,
    userAgent: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
    isMobile: true,
    hasTouch: true
  },

  // Tablet devices
  tablet: {
    name: 'Tablet (Generic)',
    width: 768,
    height: 1024,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    isMobile: false,
    hasTouch: true
  },

  ipad: {
    name: 'iPad',
    width: 768,
    height: 1024,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    isMobile: false,
    hasTouch: true
  },

  'ipad-pro': {
    name: 'iPad Pro',
    width: 1024,
    height: 1366,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    isMobile: false,
    hasTouch: true
  },

  'surface-pro': {
    name: 'Microsoft Surface Pro',
    width: 912,
    height: 1368,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    isMobile: false,
    hasTouch: true
  },

  // Desktop devices
  desktop: {
    name: 'Desktop (Generic)',
    width: 1366,
    height: 768,
    devicePixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    isMobile: false,
    hasTouch: false
  },

  'desktop-hd': {
    name: 'Desktop HD',
    width: 1920,
    height: 1080,
    devicePixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    isMobile: false,
    hasTouch: false
  },

  'desktop-4k': {
    name: 'Desktop 4K',
    width: 2560,
    height: 1440,
    devicePixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    isMobile: false,
    hasTouch: false
  },

  laptop: {
    name: 'Laptop',
    width: 1440,
    height: 900,
    devicePixelRatio: 1,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    isMobile: false,
    hasTouch: false
  },

  macbook: {
    name: 'MacBook Pro',
    width: 1440,
    height: 900,
    devicePixelRatio: 2,
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Safari/605.1.15',
    isMobile: false,
    hasTouch: false
  },

  // Smart TV / Large screens
  'smart-tv': {
    name: 'Smart TV',
    width: 1920,
    height: 1080,
    devicePixelRatio: 1,
    userAgent: 'Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/2.2 Chrome/63.0.3239.84 TV Safari/537.36',
    isMobile: false,
    hasTouch: false
  }
}

export function getDevicePreset(presetName: string): DevicePreset | null {
  const preset = DEVICE_PRESETS[presetName.toLowerCase()]
  return preset || null
}

export function getAllDevicePresets(): DevicePreset[] {
  return Object.values(DEVICE_PRESETS)
}

export function getPresetsByCategory(category: 'mobile' | 'tablet' | 'desktop'): DevicePreset[] {
  return Object.values(DEVICE_PRESETS).filter(preset => {
    switch (category) {
      case 'mobile':
        return preset.isMobile === true && preset.width < 500
      case 'tablet':
        return preset.hasTouch === true && preset.width >= 500 && preset.width < 1200
      case 'desktop':
        return preset.isMobile === false && preset.width >= 1200
      default:
        return false
    }
  })
}

export function validateDevicePreset(preset: Partial<DevicePreset>): string[] {
  const errors: string[] = []

  if (!preset.width || preset.width < 100 || preset.width > 4000) {
    errors.push('Width must be between 100 and 4000 pixels')
  }

  if (!preset.height || preset.height < 100 || preset.height > 4000) {
    errors.push('Height must be between 100 and 4000 pixels')
  }

  if (preset.devicePixelRatio && (preset.devicePixelRatio < 0.5 || preset.devicePixelRatio > 5)) {
    errors.push('Device pixel ratio must be between 0.5 and 5')
  }

  if (!preset.userAgent || preset.userAgent.trim().length === 0) {
    errors.push('User agent is required')
  }

  return errors
}
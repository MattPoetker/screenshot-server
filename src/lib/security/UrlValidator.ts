export interface UrlValidationResult {
  isValid: boolean
  error?: string
  normalizedUrl?: string
}

export class UrlValidator {
  private static blockedDomains: Set<string> = new Set([
    // Localhost and internal networks
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '169.254.0.0/16', // Link-local
    
    // Known malicious or problematic domains
    'malware.test',
    'phishing.test',
    'spam.test'
  ])

  private static allowedProtocols: Set<string> = new Set([
    'http:',
    'https:'
  ])

  private static blockedPorts: Set<number> = new Set([
    22,   // SSH
    23,   // Telnet
    25,   // SMTP
    53,   // DNS
    110,  // POP3
    143,  // IMAP
    993,  // IMAPS
    995,  // POP3S
    1433, // SQL Server
    3306, // MySQL
    5432, // PostgreSQL
    6379, // Redis
    27017 // MongoDB
  ])

  static validate(url: string): UrlValidationResult {
    // Basic URL format validation
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid URL format'
      }
    }

    // Protocol validation
    if (!this.allowedProtocols.has(parsedUrl.protocol)) {
      return {
        isValid: false,
        error: `Protocol ${parsedUrl.protocol} not allowed. Only HTTP and HTTPS are supported.`
      }
    }

    // Domain validation
    const hostname = parsedUrl.hostname.toLowerCase()
    
    // Check blocked domains
    if (this.isBlockedDomain(hostname)) {
      return {
        isValid: false,
        error: 'Domain is not allowed'
      }
    }

    // IP address validation
    if (this.isInternalIP(hostname)) {
      return {
        isValid: false,
        error: 'Internal IP addresses are not allowed'
      }
    }

    // Port validation
    const port = parsedUrl.port ? parseInt(parsedUrl.port) : (parsedUrl.protocol === 'https:' ? 443 : 80)
    if (this.blockedPorts.has(port)) {
      return {
        isValid: false,
        error: `Port ${port} is not allowed`
      }
    }

    // URL length validation
    if (url.length > 2048) {
      return {
        isValid: false,
        error: 'URL is too long (max 2048 characters)'
      }
    }

    // Additional security checks
    const securityCheck = this.performSecurityChecks(parsedUrl)
    if (!securityCheck.isValid) {
      return securityCheck
    }

    return {
      isValid: true,
      normalizedUrl: parsedUrl.toString()
    }
  }

  private static isBlockedDomain(hostname: string): boolean {
    // Direct match
    if (this.blockedDomains.has(hostname)) {
      return true
    }

    // Wildcard subdomain check
    const parts = hostname.split('.')
    for (let i = 1; i < parts.length; i++) {
      const parent = parts.slice(i).join('.')
      if (this.blockedDomains.has(parent)) {
        return true
      }
    }

    return false
  }

  private static isInternalIP(hostname: string): boolean {
    // IPv4 patterns
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    const match = hostname.match(ipv4Regex)
    
    if (match) {
      const [, a, b, c, d] = match.map(x => parseInt(x))
      
      // Invalid IP ranges
      if (a > 255 || b > 255 || c > 255 || d > 255) {
        return true
      }
      
      // Private/internal ranges
      if (
        a === 127 ||                           // Loopback
        a === 10 ||                            // Private Class A
        (a === 172 && b >= 16 && b <= 31) ||   // Private Class B
        (a === 192 && b === 168) ||            // Private Class C
        (a === 169 && b === 254)               // Link-local
      ) {
        return true
      }
    }

    // IPv6 patterns (basic check)
    if (hostname.includes('::1') || hostname.startsWith('fe80:') || hostname.startsWith('fc00:')) {
      return true
    }

    return false
  }

  private static performSecurityChecks(url: URL): UrlValidationResult {
    // Check for potentially dangerous parameters
    const dangerousParams = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:']
    const urlString = url.toString().toLowerCase()
    
    for (const dangerous of dangerousParams) {
      if (urlString.includes(dangerous)) {
        return {
          isValid: false,
          error: 'URL contains potentially dangerous content'
        }
      }
    }

    // Check for excessive redirects indicator
    if (url.searchParams.has('redirect') && url.searchParams.has('url')) {
      return {
        isValid: false,
        error: 'Potential redirect loop detected'
      }
    }

    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.exe(\?|$)/i,
      /\.scr(\?|$)/i,
      /\.bat(\?|$)/i,
      /\.com(\?|$)/i,
      /\.pif(\?|$)/i
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(url.pathname)) {
        return {
          isValid: false,
          error: 'URL contains suspicious file extension'
        }
      }
    }

    return { isValid: true }
  }

  // Add domain to blocklist
  static addBlockedDomain(domain: string): void {
    this.blockedDomains.add(domain.toLowerCase())
  }

  // Remove domain from blocklist
  static removeBlockedDomain(domain: string): void {
    this.blockedDomains.delete(domain.toLowerCase())
  }

  // Get current blocklist
  static getBlockedDomains(): string[] {
    return Array.from(this.blockedDomains)
  }

  // Validate multiple URLs
  static validateBatch(urls: string[]): UrlValidationResult[] {
    return urls.map(url => this.validate(url))
  }

  // Check if URL is safe for screenshot
  static isSafeForScreenshot(url: string): boolean {
    const result = this.validate(url)
    return result.isValid
  }
}

export default UrlValidator
# Screenshot API Documentation

## Overview
This API provides powerful screenshot generation capabilities with extensive customization options for viewport dimensions, output formats, device simulation, and content modification.

## Authentication
All requests require a Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Endpoints

### POST /screenshot

#### Basic Request
```json
{
  "url": "https://example.com"
}
```

#### Full Request Example
```json
{
  "url": "https://example.com",
  "width": 1920,
  "height": 1080,
  "format": "jpeg",
  "quality": 85,
  "fullPage": true,
  "waitFor": "networkidle0",
  "delay": 1000,
  "hideElements": [".cookie-banner", "#ads"],
  "userAgent": "Custom Bot 1.0"
}
```

## Request Parameters

### Required Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `url` | string | **Required.** The URL to capture |

### Viewport & Dimensions
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `width` | number | 1366 | Browser viewport width in pixels |
| `height` | number | 768 | Browser viewport height in pixels |
| `devicePixelRatio` | number | 1 | Device pixel ratio for high-DPI screenshots |

### Output Format & Quality
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `format` | string | "png" | Output format: `png`, `jpeg`, `webp` |
| `quality` | number | 90 | JPEG/WebP compression quality (0-100) |
| `omitBackground` | boolean | false | Transparent background for PNG format |

### Capture Scope & Behavior
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `fullPage` | boolean | false | Capture entire page height vs viewport only |
| `element` | string | null | CSS selector to capture specific element only |
| `clip` | object | null | Custom clipping rectangle `{x, y, width, height}` |

### Device Simulation & Presets
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `devicePreset` | string | null | Quick device presets: `mobile`, `tablet`, `desktop`, `iphone`, `ipad` |
| `userAgent` | string | null | Custom user agent string |
| `headers` | object | {} | Custom HTTP headers as key-value pairs |

### Timing & Loading Control
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `waitFor` | string | "load" | Wait condition: `load`, `networkidle0`, `networkidle2`, or CSS selector |
| `delay` | number | 0 | Additional delay in ms before taking screenshot |
| `timeout` | number | 30000 | Page load timeout in milliseconds |

### Content Modification
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `hideElements` | array | [] | Array of CSS selectors to hide before screenshot |
| `blockResources` | array | [] | Block resource types: `image`, `stylesheet`, `font`, `script`, `xhr`, `fetch` |
| `cookies` | array | [] | Array of cookie objects: `{name, value, domain?, path?}` |

## Device Presets

When using `devicePreset`, the following configurations are applied:

### mobile
- Width: 375px, Height: 667px
- Device Pixel Ratio: 2
- Mobile User Agent

### tablet  
- Width: 768px, Height: 1024px
- Device Pixel Ratio: 2
- Tablet User Agent

### desktop
- Width: 1366px, Height: 768px
- Device Pixel Ratio: 1
- Desktop User Agent

### iphone
- Width: 375px, Height: 812px
- Device Pixel Ratio: 3
- iPhone User Agent

### ipad
- Width: 820px, Height: 1180px
- Device Pixel Ratio: 2
- iPad User Agent

## Response Format

### Success Response (200)
```json
{
  "image": "thumbnail-1640995200000.png",
  "url": "https://images.sitelaunch.io/images/thumbnail-1640995200000.png",
  "metadata": {
    "width": 1366,
    "height": 768,
    "format": "png",
    "size": 245760,
    "captureTime": "2024-01-01T12:00:00.000Z"
  }
}
```

### Error Response (400/500)
```json
{
  "error": "Failed to capture the screenshot",
  "details": "Navigation timeout exceeded"
}
```

## Usage Examples

### Basic Screenshot
```bash
curl -X POST https://your-server.com/screenshot \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

### Custom Dimensions & Format
```bash
curl -X POST https://your-server.com/screenshot \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "width": 1920,
    "height": 1080,
    "format": "jpeg",
    "quality": 80
  }'
```

### Mobile Screenshot with Full Page
```bash
curl -X POST https://your-server.com/screenshot \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "devicePreset": "mobile",
    "fullPage": true,
    "waitFor": "networkidle0"
  }'
```

### Element-Specific Screenshot
```bash
curl -X POST https://your-server.com/screenshot \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "element": ".main-content",
    "hideElements": [".header", ".footer"],
    "omitBackground": true
  }'
```

### Advanced Configuration
```bash
curl -X POST https://your-server.com/screenshot \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "width": 1440,
    "height": 900,
    "format": "webp",
    "quality": 85,
    "fullPage": true,
    "waitFor": "networkidle2",
    "delay": 2000,
    "hideElements": [".cookie-banner", "#popup"],
    "blockResources": ["image", "font"],
    "userAgent": "CustomBot/1.0",
    "headers": {
      "X-Custom-Header": "value"
    }
  }'
```

## Health Check

### GET /health
Returns server health status and operational information.

#### Response
```json
{
  "status": "up",
  "uptime": "3600s",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "storage": "accessible",
  "browser": "operational"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Missing or invalid parameters |
| 401 | Unauthorized - Missing authentication token |
| 403 | Forbidden - Invalid authentication token |
| 500 | Internal Server Error - Screenshot generation failed |
| 503 | Service Unavailable - Browser or storage unavailable |

## Rate Limits

- Maximum 100 requests per minute per token
- Maximum image size: 10MB
- Timeout limits: 60 seconds maximum page load time
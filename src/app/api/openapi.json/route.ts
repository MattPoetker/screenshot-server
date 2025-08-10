import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
    try {
        const yamlPath = path.join(process.cwd(), 'openapi.yaml')
        const yamlContent = fs.readFileSync(yamlPath, 'utf8')
        
        // Parse YAML to JSON using a simple approach
        // For a more robust solution, you might want to use a proper YAML parser
        // But for simplicity, we'll convert the YAML to JSON manually or use a server-side parser
        const yaml = require('js-yaml')
        const jsonSpec = yaml.load(yamlContent)
        
        return NextResponse.json(jsonSpec, {
            headers: {
                'Cache-Control': 'public, max-age=3600'
            }
        })
    } catch (error) {
        console.error('Error loading OpenAPI spec:', error)
        return NextResponse.json(
            { error: 'OpenAPI specification not found' },
            { status: 404 }
        )
    }
}
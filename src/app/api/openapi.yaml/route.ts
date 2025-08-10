import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
    try {
        const yamlPath = path.join(process.cwd(), 'openapi.yaml')
        const yamlContent = fs.readFileSync(yamlPath, 'utf8')
        
        return new NextResponse(yamlContent, {
            headers: {
                'Content-Type': 'application/x-yaml',
                'Cache-Control': 'public, max-age=3600'
            }
        })
    } catch (error) {
        return NextResponse.json(
            { error: 'OpenAPI specification not found' },
            { status: 404 }
        )
    }
}
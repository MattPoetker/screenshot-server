import { NextRequest, NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db/init'
import dbManager from '@/lib/db'
import Screenshot from '@/lib/models/Screenshot'
import { authenticateAdmin } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        await initializeDatabase()
        
        // Authenticate admin user
        const authResult = await authenticateAdmin(request)
        if (!authResult.success) {
            return NextResponse.json(authResult, { status: 401 })
        }

        const { searchParams } = request.nextUrl
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
        const offset = (page - 1) * limit

        // Build WHERE clause based on filters
        let whereClause = '1=1'
        const params: any[] = []

        if (searchParams.get('format')) {
            whereClause += ' AND s.format = ?'
            params.push(searchParams.get('format'))
        }

        if (searchParams.get('success') !== null) {
            whereClause += ' AND s.success = ?'
            params.push(searchParams.get('success') === 'true' ? 1 : 0)
        }

        if (searchParams.get('start_date')) {
            whereClause += ' AND s.created_at >= ?'
            params.push(searchParams.get('start_date'))
        }

        if (searchParams.get('end_date')) {
            whereClause += ' AND s.created_at <= ?'
            params.push(searchParams.get('end_date'))
        }

        if (searchParams.get('api_key_id')) {
            whereClause += ' AND s.api_key_id = ?'
            params.push(parseInt(searchParams.get('api_key_id')!))
        }

        // Get total count
        const totalResult = await dbManager.get(
            `SELECT COUNT(*) as total FROM screenshots s 
             LEFT JOIN api_keys ak ON s.api_key_id = ak.id 
             WHERE ${whereClause}`,
            params
        )

        // Get paginated results
        const screenshots = await dbManager.all(
            `SELECT 
                s.*,
                ak.name as api_key_name,
                u.username
             FROM screenshots s
             LEFT JOIN api_keys ak ON s.api_key_id = ak.id
             LEFT JOIN users u ON ak.created_by = u.id
             WHERE ${whereClause}
             ORDER BY s.created_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        )

        return NextResponse.json({
            success: true,
            data: {
                screenshots: screenshots.map(s => ({
                    ...s,
                    success: s.success === 1,
                    metadata: s.metadata ? JSON.parse(s.metadata) : null
                })),
                pagination: {
                    page,
                    limit,
                    total: totalResult.total,
                    pages: Math.ceil(totalResult.total / limit)
                }
            }
        })
    } catch (error) {
        console.error('NiceShot API error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Failed to load screenshots' 
        }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await initializeDatabase()
        
        // Authenticate admin user
        const authResult = await authenticateAdmin(request)
        if (!authResult.success) {
            return NextResponse.json(authResult, { status: 401 })
        }

        const body = await request.json()
        const { ids } = body

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ 
                success: false,
                error: 'Screenshot IDs are required' 
            }, { status: 400 })
        }

        // Delete screenshots
        const placeholders = ids.map(() => '?').join(',')
        const result = await dbManager.run(
            `DELETE FROM screenshots WHERE id IN (${placeholders})`,
            ids
        )

        return NextResponse.json({
            success: true,
            data: {
                deleted: result.changes,
                message: `Successfully deleted ${result.changes} screenshot(s)`
            }
        })
    } catch (error) {
        console.error('Screenshot deletion error:', error)
        return NextResponse.json({ 
            success: false,
            error: 'Failed to delete screenshots' 
        }, { status: 500 })
    }
}
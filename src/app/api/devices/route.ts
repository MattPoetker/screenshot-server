import { NextRequest, NextResponse } from 'next/server'
import { getAllDevicePresets, getPresetsByCategory, getDevicePreset } from '@/lib/config/devicePresets'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl
        const category = searchParams.get('category')
        const preset = searchParams.get('preset')

        // If requesting a specific preset
        if (preset) {
            const devicePreset = getDevicePreset(preset)
            if (!devicePreset) {
                return NextResponse.json(
                    { error: 'Device preset not found', preset },
                    { status: 404 }
                )
            }
            return NextResponse.json({ device: devicePreset })
        }

        // If requesting by category
        if (category) {
            if (!['mobile', 'tablet', 'desktop'].includes(category)) {
                return NextResponse.json(
                    { error: 'Invalid category. Must be: mobile, tablet, or desktop' },
                    { status: 400 }
                )
            }
            
            const devices = getPresetsByCategory(category as 'mobile' | 'tablet' | 'desktop')
            return NextResponse.json({
                category,
                count: devices.length,
                devices
            })
        }

        // Return all presets
        const allDevices = getAllDevicePresets()
        const categorized = {
            mobile: getPresetsByCategory('mobile'),
            tablet: getPresetsByCategory('tablet'),
            desktop: getPresetsByCategory('desktop')
        }

        return NextResponse.json({
            total: allDevices.length,
            categories: {
                mobile: categorized.mobile.length,
                tablet: categorized.tablet.length,
                desktop: categorized.desktop.length
            },
            devices: categorized,
            all: allDevices
        })

    } catch (error) {
        console.error('Device presets API error:', error)
        return NextResponse.json(
            { error: 'Failed to retrieve device presets' },
            { status: 500 }
        )
    }
}
'use client'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import 'swagger-ui-react/swagger-ui.css'

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { 
    ssr: false,
    loading: () => <div className="p-8">Loading API documentation...</div>
})

export default function DocsPage() {
    const [spec, setSpec] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function loadSpec() {
            try {
                const response = await fetch('/api/openapi.json')
                if (!response.ok) {
                    throw new Error('Failed to load OpenAPI specification')
                }
                const jsonSpec = await response.json()
                setSpec(jsonSpec)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }

        loadSpec()
    }, [])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-lg text-gray-600">Loading API documentation...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Documentation</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen">
            <div className="bg-gray-50 border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">NiceShot API Documentation</h1>
                    <p className="mt-2 text-gray-600">
                        Interactive API documentation for the NiceShot Service
                    </p>
                </div>
            </div>
            
            {spec && (
                <div style={{ backgroundColor: '#fff' }}>
                    <SwaggerUI 
                        spec={spec}
                        docExpansion="list"
                        defaultModelsExpandDepth={1}
                        defaultModelExpandDepth={1}
                        tryItOutEnabled={true}
                        filter={true}
                        showExtensions={true}
                        showCommonExtensions={true}
                        persistAuthorization={true}
                        onComplete={() => {
                            // Hide the Swagger UI topbar
                            const style = document.createElement('style')
                            style.innerHTML = `
                                .swagger-ui .topbar { display: none !important; }
                                .swagger-ui .info { margin-top: 0 !important; }
                            `
                            document.head.appendChild(style)
                        }}
                    />
                </div>
            )}
        </div>
    )
}
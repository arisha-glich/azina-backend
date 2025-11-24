import { Scalar } from '@scalar/hono-api-reference'
import type { AppOpenAPI } from '~/types'

export default function configureOpenAPI(app: AppOpenAPI) {
  try {
    app.doc('/doc', {
      openapi: '3.0.0',
      info: {
        version: '1',
        title: 'API Docs',
      },
      servers: [
        {
          url: '',
          description: 'API v1',
        },
      ],
    })
  } catch (error) {
    console.error('❌ [configureOpenAPI] Error setting up /doc endpoint:', error)
    throw error
  }

  try {
    app.get(
      '/reference',
      Scalar({
        theme: 'kepler',
        layout: 'modern',
        url: '/doc',
        showSidebar: true,
        hideModels: true,
        hideDownloadButton: false,
        hideTestRequestButton: false,
        searchHotKey: 'k',
        hiddenClients: true,
        hideClientButton: true,
        defaultHttpClient: {
          targetKey: 'js',
          clientKey: 'fetch',
        },
        authentication: {
          preferredSecurityScheme: 'bearerAuth',
        },
      })
    )
  } catch (error) {
    console.error('❌ [configureOpenAPI] Error setting up /reference endpoint:', error)
    throw error
  }
}

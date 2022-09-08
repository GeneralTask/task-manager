import App from '../App'
import React from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'
import { isDevelopmentMode } from './environment'

if (!isDevelopmentMode) {
    Sentry.init({
        dsn: 'https://fac9999515c14cf7a15fbe9b4eddcd3d@o1302719.ingest.sentry.io/6577051',
        integrations: [
            new BrowserTracing({ tracingOrigins: ['http://localhost:8080/*', 'https://api.generaltask.com/*'] }),
        ],
        environment: process.env.NODE_ENV,

        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // If we get too many traces, we can adjust this value.
        // For now, we probably want to capture everything.
        tracesSampleRate: 1.0,
    })
}
const root = createRoot(document.getElementById('root') as Element)
root.render(<App />)

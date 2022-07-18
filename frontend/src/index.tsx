import App from '../App'
import React from 'react'
import ReactDOM from 'react-dom'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

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

ReactDOM.render(<App />, document.getElementById('root'))

import App from '../App'
import React from 'react'
import ReactDOM from 'react-dom'
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

Sentry.init({
    dsn: 'https://fac9999515c14cf7a15fbe9b4eddcd3d@o1302719.ingest.sentry.io/6577051',
    integrations: [new BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
})

ReactDOM.render(<App />, document.getElementById('root'))

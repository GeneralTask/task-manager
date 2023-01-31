import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from '../App'
import { isDevelopmentMode } from './environment'

if (!isDevelopmentMode) {
    Sentry.init({
        dsn: 'https://fac9999515c14cf7a15fbe9b4eddcd3d@o1302719.ingest.sentry.io/6577051',
        environment: process.env.NODE_ENV,

        // This sets the sample rate to be 10%. You may want this to be 100% while
        // in development and sample at a lower rate in production
        replaysSessionSampleRate: 1.0,
        // If the entire session is not sampled, use the below sample rate to sample
        // sessions when an error occurs.
        replaysOnErrorSampleRate: 1.0,

        integrations: [new Sentry.Replay({ blockAllMedia: false })],
    })
}
const root = createRoot(document.getElementById('root') as Element)
root.render(<App />)

/* eslint-disable no-console */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { isDevelopmentMode } from './environment'

/**
 * This file is used to suppress console.error messages that are not relevant to the application.
 * This is a temporary solution until the issue is resolved in the library.
 */

const suppressConsoleErrors = () => {
    const messagesToSuppress = [
        'The pseudo class ":first-child" is potentially unsafe when doing server-side rendering. Try changing it to ":first-of-type".',
        'Warning: ReactDOM.render is no longer supported in React 18. Use createRoot instead.',
        'Warning: ReactDOM.unstable_renderSubtreeIntoContainer() is no longer supported in React 18.',
    ] as const

    const backupConsoleError = console.error.bind(console)
    console.error = (message?: any, ...optionalParams: any[]) => {
        if (message && messagesToSuppress.some((msg) => message.includes(msg))) {
            return
        } else {
            console.log('uhh', message)
            backupConsoleError(message, ...optionalParams)
        }
    }
}

if (isDevelopmentMode) {
    suppressConsoleErrors()
}

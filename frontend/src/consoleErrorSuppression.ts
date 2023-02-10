//eslint-disable no-console @typescript-eslint/no-explicit-any
/**
 * This file is used to suppress console.error messages that are not relevant to the application.
 * This is a temporary solution until the issue is resolved in the library.
 */

const messagesToSuppress = [
    'The pseudo class ":first-child" is potentially unsafe when doing server-side rendering. Try changing it to ":first-of-type".',
] as const

const backupConsoleError = console.error.bind(console)
console.error = (message?: any, ...optionalParams: any[]) => {
    if (messagesToSuppress.includes(message)) {
        return
    } else {
        backupConsoleError(message, ...optionalParams)
    }
}

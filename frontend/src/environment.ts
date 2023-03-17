const ENV = {
    dev: {
        REACT_APP_API_BASE_URL: 'http://localhost:8080',
        REACT_APP_FRONTEND_BASE_URL: 'http://localhost:3000',
        REACT_APP_NOTES_BASE_URL: 'http://localhost:3000',
        REACT_APP_TASK_BASE_URL: 'http://localhost:3000',
        REACT_APP_TRY_BASE_URL: 'http://localhost:3000',
        REACT_APP_TRY_SIGN_UP_URL: 'http://localhost:3000',
        COOKIE_DOMAIN: '.localhost',
    },
    prod: {
        REACT_APP_API_BASE_URL: 'https://api.generaltask.com',
        REACT_APP_FRONTEND_BASE_URL: 'https://generaltask.com',
        REACT_APP_NOTES_BASE_URL: 'https://notes.generaltask.com',
        REACT_APP_TASK_BASE_URL: 'https://share.generaltask.com',
        REACT_APP_TRY_BASE_URL: 'https://try.generaltask.com',
        REACT_APP_TRY_SIGN_UP_URL: 'https://try.generaltask.com/sign-up',
        COOKIE_DOMAIN: '.generaltask.com',
    },
}

export const isDevelopmentMode: boolean = !process.env.NODE_ENV || process.env.NODE_ENV === 'development'

const getEnvVars = () => {
    return isDevelopmentMode ? ENV.dev : ENV.prod
}

export default getEnvVars

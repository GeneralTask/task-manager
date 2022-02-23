const ENV = {
    dev: {
        REACT_APP_API_BASE_URL: 'http://localhost:8080',
        REACT_APP_FRONTEND_BASE_URL: 'http://localhost:19006',
    },
    prod: {
        REACT_APP_API_BASE_URL: 'https://api.generaltask.com',
        REACT_APP_FRONTEND_BASE_URL: 'https://generaltask.com',
    }
}

const getEnvVars = () => {
    if (__DEV__) return ENV.dev
    return ENV.prod
}

export default getEnvVars

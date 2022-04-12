const ENV = {
    dev: {
        REACT_APP_API_BASE_URL: 'http://localhost:8080',
        REACT_APP_FRONTEND_BASE_URL: 'http://localhost:3000',
    },
    prod: {
        REACT_APP_API_BASE_URL: 'https://api.generaltask.com',
        REACT_APP_FRONTEND_BASE_URL: 'https://generaltask.com',
    }
}

export const isDevelopmentMode: boolean = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

const getEnvVars = () => {
    return isDevelopmentMode ? ENV.dev : ENV.prod;
}

export default getEnvVars

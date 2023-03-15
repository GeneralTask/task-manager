import axios from 'axios'
import Cookie from 'js-cookie'
import {
    AUTHORIZATION_COOKE,
    COOKIE_DOMAIN,
    GOOGLE_AUTH_ROUTE,
    NOTE_ROUTE,
    PRIVACY_POLICY_ROUTE,
    TERMS_OF_SERVICE_ROUTE,
} from '../constants'
import getEnvVars from '../environment'

const { REACT_APP_FRONTEND_BASE_URL, REACT_APP_API_BASE_URL } = getEnvVars()

// slightly hacky way of checking if a page should be accessible if the user is not logged in
export const isPublicPage = () => {
    return [TERMS_OF_SERVICE_ROUTE, PRIVACY_POLICY_ROUTE, NOTE_ROUTE, GOOGLE_AUTH_ROUTE].includes(
        window.location.pathname.split('/')[1] // removes leading slash from url
    )
}

const apiClient = axios.create({
    baseURL: REACT_APP_API_BASE_URL,
})

apiClient.interceptors.request.use(
    (config) => {
        config.headers = {
            Authorization: `Bearer ${Cookie.get(AUTHORIZATION_COOKE)}`,
            'Access-Control-Allow-Origin': REACT_APP_FRONTEND_BASE_URL,
            'Access-Control-Allow-Headers':
                'Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Timezone-Offset',
            'Access-Control-Allow-Methods': 'POST,OPTIONS,GET,PATCH,DELETE',
            'Timezone-Offset': new Date().getTimezoneOffset().toString(),
        }
        return config
    },
    (error) => Promise.reject(error)
)

apiClient.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        if (error.response.status === 401 && !isPublicPage()) {
            axios.defaults.headers.common['Authorization'] = ''
            Cookie.remove(AUTHORIZATION_COOKE, { path: '/', domain: COOKIE_DOMAIN })
            Cookie.remove(AUTHORIZATION_COOKE) // used for cypress tests
            window.location.replace(REACT_APP_FRONTEND_BASE_URL)
        }
        return error
    }
)

export default apiClient

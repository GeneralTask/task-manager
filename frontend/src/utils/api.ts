import Cookies from 'js-cookie'
import axios from 'axios'
import getEnvVars from '../environment'

const { REACT_APP_FRONTEND_BASE_URL, REACT_APP_API_BASE_URL } = getEnvVars()

const apiClient = axios.create({
    baseURL: REACT_APP_API_BASE_URL,
})

apiClient.interceptors.request.use(
    config => {
        config.headers = {
            Authorization: `Bearer ${Cookies.get('authToken')}`,
            'Access-Control-Allow-Origin': REACT_APP_FRONTEND_BASE_URL,
            'Access-Control-Allow-Headers':
                'Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Timezone-Offset',
            'Access-Control-Allow-Methods': 'POST,OPTIONS,GET,PATCH,DELETE',
            'Timezone-Offset': new Date().getTimezoneOffset().toString(),
        }
        return config
    },
    error => Promise.reject(error)
)

apiClient.interceptors.response.use(response => {
    return response
}, error => {
    if (error.response.status === 401) {
        axios.defaults.headers.common['Authorization'] = ''
        Cookies.remove('authToken')
        window.location.href = '/'
    }
    return error
})

export default apiClient

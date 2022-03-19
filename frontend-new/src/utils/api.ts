import axios from 'axios'
import Cookies from 'js-cookie'
import getEnvVars from '../environment'

const { REACT_APP_FRONTEND_BASE_URL, REACT_APP_API_BASE_URL } = getEnvVars()

export const apiClient = axios.create({
    baseURL: REACT_APP_API_BASE_URL,
    headers: {
        Authorization: `Bearer ${Cookies.get('authToken')}`,
        'Access-Control-Allow-Origin': REACT_APP_FRONTEND_BASE_URL,
        'Access-Control-Allow-Headers':
            'Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Timezone-Offset',
        'Access-Control-Allow-Methods': 'POST,OPTIONS,GET,PATCH,DELETE',
        'Timezone-Offset': new Date().getTimezoneOffset().toString(),
    },
})

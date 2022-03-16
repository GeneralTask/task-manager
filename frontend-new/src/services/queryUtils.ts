import Cookies from 'js-cookie'
import { MESSAGES_PER_PAGE } from '../constants'
import getEnvVars from '../environment'
const { REACT_APP_FRONTEND_BASE_URL, REACT_APP_API_BASE_URL } = getEnvVars()

export const fetchInfiniteMessages = async ({ pageParam = 1 }) => {
    const res = await fetch(`${REACT_APP_API_BASE_URL}/messages/v2/?page=${pageParam}&limit=${MESSAGES_PER_PAGE}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${Cookies.get('authToken')}`,
            'Access-Control-Allow-Origin': REACT_APP_FRONTEND_BASE_URL,
            'Access-Control-Allow-Headers':
                'Content-Type,Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Timezone-Offset',
            'Access-Control-Allow-Methods': 'POST,OPTIONS,GET,PATCH,DELETE',
            'Timezone-Offset': new Date().getTimezoneOffset().toString(),
        },
    })
    return res.json()
}

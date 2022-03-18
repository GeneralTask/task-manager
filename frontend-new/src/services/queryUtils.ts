import { MESSAGES_PER_PAGE } from '../constants'
import getEnvVars from '../environment'
import { getHeaders } from '../utils/api'
const { REACT_APP_API_BASE_URL } = getEnvVars()

export const fetchInfiniteMessages = async ({ pageParam = 1 }) => {
    const res = await fetch(`${REACT_APP_API_BASE_URL}/messages/v2/?page=${pageParam}&limit=${MESSAGES_PER_PAGE}`, {
        method: 'GET',
        headers: getHeaders(),
    })
    return res.json()
}

export const fetchMessages = async () => {
    const res = await fetch(`${REACT_APP_API_BASE_URL}/messages/fetch/`, {
        method: 'GET',
        headers: getHeaders(),
    })
    return res.json()
}

export const fetchUserInfo = async () => {
    const res = await fetch(`${REACT_APP_API_BASE_URL}/user_info/`, {
        method: 'GET',
        headers: getHeaders(),
    })
    return res.json()
}

export const mutateUserInfo = async (userInfo: { agreed_to_terms: boolean, opted_into_marketing: boolean }) => {
    const res = await fetch(`${REACT_APP_API_BASE_URL}/user_info/`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(userInfo),
    })
    return res.json()
}

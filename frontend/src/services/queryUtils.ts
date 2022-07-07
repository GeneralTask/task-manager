import { Immutable } from 'immer'
import Cookies from 'js-cookie'
import { QueryClient, QueryKey, useQueryClient } from 'react-query'
import { QueryFilters } from 'react-query/types/core/utils'
import { AUTHORIZATION_COOKE, MESSAGES_PER_PAGE } from '../constants'
import getEnvVars from '../environment'
const { REACT_APP_FRONTEND_BASE_URL, REACT_APP_API_BASE_URL } = getEnvVars()

export const fetchInfiniteMessages = async ({ pageParam = 1 }) => {
    const res = await fetch(`${REACT_APP_API_BASE_URL}/messages/v2/?page=${pageParam}&limit=${MESSAGES_PER_PAGE}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${Cookies.get(AUTHORIZATION_COOKE)}`,
            'Access-Control-Allow-Origin': REACT_APP_FRONTEND_BASE_URL,
            'Access-Control-Allow-Headers':
                'Content-Type,Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Timezone-Offset',
            'Access-Control-Allow-Methods': 'POST,OPTIONS,GET,PATCH,DELETE',
            'Timezone-Offset': new Date().getTimezoneOffset().toString(),
        },
    })
    return res.json()
}

export const fetchUserInfo = async () => {
    const res = await fetch(`${REACT_APP_API_BASE_URL}/user_info/`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${Cookies.get(AUTHORIZATION_COOKE)}`,
            'Access-Control-Allow-Origin': REACT_APP_FRONTEND_BASE_URL,
            'Access-Control-Allow-Headers':
                'Content-Type,Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Timezone-Offset',
            'Access-Control-Allow-Methods': 'POST,OPTIONS,GET,PATCH,DELETE',
            'Timezone-Offset': new Date().getTimezoneOffset().toString(),
        },
    })
    return res.json()
}

export const mutateUserInfo = async (userInfo: { agreed_to_terms: boolean; opted_into_marketing: boolean }) => {
    const res = await fetch(`${REACT_APP_API_BASE_URL}/user_info/`, {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${Cookies.get(AUTHORIZATION_COOKE)}`,
            'Access-Control-Allow-Origin': REACT_APP_FRONTEND_BASE_URL,
            'Access-Control-Allow-Headers':
                'Content-Type,Authorization,Access-Control-Allow-Origin,Access-Control-Allow-Headers,Access-Control-Allow-Methods,Timezone-Offset',
            'Access-Control-Allow-Methods': 'POST,OPTIONS,GET,PATCH,DELETE',
            'Timezone-Offset': new Date().getTimezoneOffset().toString(),
        },
        body: JSON.stringify(userInfo),
    })
    return res.json()
}

interface GTQueryClient extends QueryClient {
    getImmutableQueryData: <TData = unknown>(queryKey: QueryKey, filters?: QueryFilters) => Immutable<TData> | undefined
}

export const useGTQueryClient = (): GTQueryClient => {
    const queryClient = useQueryClient() as GTQueryClient

    queryClient.getImmutableQueryData = <TData = unknown>(queryKey: QueryKey, filters?: QueryFilters): Immutable<TData> | undefined => queryClient.getQueryData(queryKey, filters)

    // const newQueryClient = queryClient as GTQueryClient
    // newQueryClient.getImmutableQueryData = getImmutableQueryData

    return queryClient
}

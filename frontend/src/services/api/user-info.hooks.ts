import { QueryFunctionContext, useQuery } from 'react-query'
import * as Sentry from '@sentry/react'
import { castImmutable } from 'immer'
import apiClient from '../../utils/api'
import { TUserInfo } from '../../utils/types'

export const useGetUserInfo = () => {
    return useQuery<TUserInfo>('user_info', getUserInfo, { refetchOnMount: false })
}
const getUserInfo = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/user_info/', { signal })
        Sentry.setUser({ email: res.data.email })
        return castImmutable(res.data)
    } catch {
        throw 'getUserInfo failed'
    }
}

interface TUserInfoUpdateParams {
    agreed_to_terms?: boolean
    opted_into_marketing?: boolean
    name?: string
}
export const mutateUserInfo = async (userInfo: TUserInfoUpdateParams) => {
    try {
        const res = await apiClient.patch('/user_info/', JSON.stringify(userInfo))
        return castImmutable(res.data)
    } catch {
        throw 'mutateUserInfo failed'
    }
}

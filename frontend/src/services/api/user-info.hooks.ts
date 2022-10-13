import { QueryFunctionContext, useQuery } from 'react-query'
import { castImmutable } from 'immer'
import apiClient from '../../utils/api'
import { TUserInfo } from '../../utils/types'

export const useGetUserInfo = () => {
    return useQuery<TUserInfo>('user_info', getUserInfo)
}
const getUserInfo = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/user_info/', { signal })
        return castImmutable(res.data)
    } catch {
        throw new Error('getUserInfo failed')
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
        throw new Error('mutateUserInfo failed')
    }
}

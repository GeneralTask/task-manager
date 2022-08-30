import { castImmutable } from "immer"
import { QueryFunctionContext, useQuery } from "react-query"
import apiClient from "../../utils/api"
import { TUserInfo } from "../../utils/types"

export const useGetUserInfo = () => {
    return useQuery('user_info', getUserInfo)
}
const getUserInfo = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/user_info/', { signal })
        return castImmutable(res.data)
    } catch {
        throw new Error('getUserInfo failed')
    }
}

export const mutateUserInfo = async (userInfo: TUserInfo) => {
    try {
        const res = await apiClient.patch('/user_info/', JSON.stringify(userInfo))
        return castImmutable(res.data)
    } catch {
        throw new Error('mutateUserInfo failed')
    }
}

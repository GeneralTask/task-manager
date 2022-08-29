import { castImmutable } from "immer"
import { useQuery, useMutation, QueryFunctionContext } from "react-query"
import apiClient from "../../utils/api"
import { TLinkedAccount, TSupportedType } from "../../utils/types"
import { useGTQueryClient } from "../queryUtils"

export const useGetLinkedAccounts = () => {
    return useQuery<TLinkedAccount[]>('linked_accounts', getLinkedAccounts)
}
const getLinkedAccounts = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/linked_accounts/', { signal })
        return castImmutable(res.data)
    } catch {
        throw new Error('getLinkedAccounts failed')
    }
}

export const useGetSupportedTypes = () => {
    return useQuery<TSupportedType[]>('supported_types', getSupportedTypes)
}
const getSupportedTypes = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/linked_accounts/supported_types/', { signal })
        return castImmutable(res.data)
    } catch {
        throw new Error('getSupportedTypes failed')
    }
}

export const useDeleteLinkedAccount = () => {
    const queryClient = useGTQueryClient()
    return useMutation(deleteLinkedAccount, {
        onSettled: () => {
            queryClient.invalidateQueries('linked_accounts')
        },
    })
}
const deleteLinkedAccount = async (data: { id: string }) => {
    try {
        const res = await apiClient.delete(`/linked_accounts/${data.id}/`)
        return castImmutable(res.data)
    } catch {
        throw new Error('deleteLinkedAccount failed')
    }
}

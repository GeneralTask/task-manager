import { QueryFunctionContext, useMutation, useQuery } from 'react-query'
import produce, { castImmutable } from 'immer'
import apiClient from '../../utils/api'
import { TLinkedAccount, TSetting, TSupportedType } from '../../utils/types'
import { useGTQueryClient } from '../queryUtils'

interface TUpdateSettingsData {
    [field_key: string]: string
}

export const useGetSettings = () => {
    return useQuery<TSetting[]>('settings', getSettings)
}
const getSettings = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/settings/', { signal })
        return castImmutable(res.data)
    } catch {
        throw new Error('getSettings failed')
    }
}

export const useUpdateSettings = () => {
    const queryClient = useGTQueryClient()
    return useMutation(updateSettings, {
        onMutate: async (data) => {
            await queryClient.cancelQueries('settings')
            const settings = queryClient.getQueryData<TSetting[]>('settings')
            if (!settings) return

            const newSettings = produce(settings, draft => {
                for (const [fieldKey, choiceKey] of Object.entries(data)) {
                    const setting = draft.find(setting => setting.field_key === fieldKey)
                    if (setting) setting.field_value = choiceKey
                }
            })
            queryClient.setQueryData('settings', newSettings)
        },
        onSettled: () => {
            queryClient.invalidateQueries('settings')
        },
    })
}
const updateSettings = async (data: TUpdateSettingsData) => {
    try {
        await apiClient.patch('/settings/', data)
    } catch {
        throw new Error('updateSettings failed')
    }
}

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

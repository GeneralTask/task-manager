import { useNavigate } from 'react-router-dom'
import { QueryFunctionContext, useQuery } from '@tanstack/react-query'
import produce, { castImmutable } from 'immer'
import { DEFAULT_FOLDER_ID } from '../../constants'
import useQueryContext from '../../context/QueryContext'
import apiClient from '../../utils/api'
import { TRecurringTaskTemplate, TTaskFolder } from '../../utils/types'
import { arrayMoveInPlace } from '../../utils/utils'
import { useGTMutation, useGTQueryClient } from '../queryUtils'

interface TAddFolderData {
    optimisticId: string
    name: string
    id_ordering?: number
}
interface TAddFolderResponse {
    id: string
}
interface TDeleteFolderData {
    id: string
}
interface TModifyFolderData {
    id: string
    name?: string
    id_ordering?: number
}

export const useGetFolders = (isEnabled = true) => {
    return useQuery<TTaskFolder[], void>(['folders'], getFolders, { enabled: isEnabled, refetchOnMount: false })
}
const getFolders = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/sections/v2/', { signal })
        return castImmutable(res.data)
    } catch {
        throw new Error('getFolders failed')
    }
}

export const useAddFolder = () => {
    const queryClient = useGTQueryClient()
    const { setOptimisticId } = useQueryContext()
    const navigate = useNavigate()

    return useGTMutation((data: TAddFolderData) => addFolder(data), {
        tag: ['folders'],
        invalidateTagsOnSettled: [['folders'], ['settings'], ['overview-supported-views']],
        onMutate: async (data) => {
            await queryClient.cancelQueries(['folders'])

            const folders = queryClient.getImmutableQueryData<TTaskFolder[]>(['folders'])
            if (!folders) return
            const newFolder: TTaskFolder = {
                id: data.optimisticId,
                optimisticId: data.optimisticId,
                name: data.name,
                is_done: false,
                is_trash: false,
                task_ids: [],
            }
            const newFolders = produce(folders, (draft) => {
                draft.splice(folders.length - 1, 0, newFolder)
            })
            queryClient.setQueryData(['folders'], newFolders)
        },
        onSuccess: ({ id }: TAddFolderResponse, { optimisticId }) => {
            setOptimisticId(optimisticId, id)
            const folders = queryClient.getImmutableQueryData<TTaskFolder[]>(['folders'])
            if (!folders) return
            const newFolders = produce(folders, (draft) => {
                const folder = draft.find((folder) => folder.optimisticId === optimisticId)
                if (!folder) return
                folder.id = id
                folder.optimisticId = undefined
            })
            queryClient.setQueryData(['folders'], newFolders)
            if (window.location.pathname.includes(`tasks/${optimisticId}`)) {
                navigate(window.location.pathname.replace(optimisticId, id), { replace: true })
            }
        },
    })
}
const addFolder = async (data: TAddFolderData) => {
    try {
        const res = await apiClient.post('/sections/create/', data)
        return castImmutable(res.data)
    } catch {
        throw new Error('addFolder failed')
    }
}

export const useDeleteFolder = () => {
    const queryClient = useGTQueryClient()
    return useGTMutation(({ id }: TDeleteFolderData) => deleteFolder(id), {
        tag: ['folders'],
        invalidateTagsOnSettled: [['folders'], ['settings'], ['overview-supported-views'], ['recurring-tasks']],
        onMutate: async ({ id }) => {
            await Promise.all([queryClient.cancelQueries(['folders']), queryClient.cancelQueries(['recurring-tasks'])])

            const folders = queryClient.getImmutableQueryData<TTaskFolder[]>(['folders'])
            if (!folders) return
            const newFolders = produce(folders, (draft) => {
                const folderIndex = draft.findIndex((folder) => folder.id === id)
                if (folderIndex === -1) return
                draft.splice(folderIndex, 1)
            })
            queryClient.setQueryData(['folders'], newFolders)

            const templates = queryClient.getImmutableQueryData<TRecurringTaskTemplate[]>(['recurring-tasks'])
            if (!templates) return
            const newTemplates = produce(templates, (draft) => {
                draft.forEach((t) => {
                    if (t.id_task_section === id) {
                        t.id_task_section = DEFAULT_FOLDER_ID
                    }
                })
            })
            queryClient.setQueryData(['recurring-tasks'], newTemplates)
        },
    })
}
const deleteFolder = async (id: string) => {
    try {
        const res = await apiClient.delete(`/sections/delete/${id}/`)
        return castImmutable(res.data)
    } catch {
        throw new Error('deleteFolder failed')
    }
}

export const useModifyFolder = () => {
    const queryClient = useGTQueryClient()
    return useGTMutation((data: TModifyFolderData) => modifyFolder(data), {
        tag: ['folders'],
        invalidateTagsOnSettled: [['folders'], ['overview-supported-views']],
        onMutate: async (data: TModifyFolderData) => {
            await queryClient.cancelQueries(['folders'])

            const folders = queryClient.getImmutableQueryData<TTaskFolder[]>(['folders'])
            if (!folders) return

            const newFolders = produce(folders, (draft) => {
                const folderIndex = draft.findIndex((folder) => folder.id === data.id)
                if (folderIndex === -1) return
                if (data.name) draft[folderIndex].name = data.name
                if (data.id_ordering) {
                    let endIndex = data.id_ordering
                    if (folderIndex < endIndex) {
                        endIndex -= 1
                    }
                    arrayMoveInPlace(draft, folderIndex, endIndex)
                }
            })
            queryClient.setQueryData(['folders'], newFolders)
        },
    })
}
const modifyFolder = async ({ id, name, id_ordering }: TModifyFolderData) => {
    try {
        const res = await apiClient.patch(`/sections/modify/${id}/`, {
            name,
            id_ordering,
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('modifyFolder failed')
    }
}

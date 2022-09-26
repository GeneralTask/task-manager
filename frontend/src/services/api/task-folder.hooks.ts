import { useMutation } from 'react-query'
import produce, { castImmutable } from 'immer'
import { TASK_FOLDER_DEFAULT_ID } from '../../constants'
import apiClient from '../../utils/api'
import { TTaskFolder } from '../../utils/types'
import { useGTQueryClient } from '../queryUtils'
import { arrayMoveInPlace } from '../../utils/utils'

interface TAddTaskFolderData {
    name: string
}

interface TModifyTaskFolderData {
    folderId: string
    name?: string
    id_ordering?: number
}

export const useAddTaskFolder = () => {
    const queryClient = useGTQueryClient()
    return useMutation((data: TAddTaskFolderData) => addTaskFolder(data), {
        onMutate: async (data: TAddTaskFolderData) => {
            // cancel all current getTasks queries
            await queryClient.cancelQueries('tasks')

            const folders = queryClient.getImmutableQueryData<TTaskFolder[]>('tasks')
            if (!folders) return
            const newFolder: TTaskFolder = {
                id: TASK_FOLDER_DEFAULT_ID,
                name: data.name,
                is_done: false,
                is_trash: false,
                tasks: [],
            }
            const newFolders = produce(folders, (draft) => {
                draft.splice(folders.length - 1, 0, newFolder)
            })
            queryClient.setQueryData('tasks', newFolders)
        },
        onSettled: () => {
            queryClient.invalidateQueries('tasks')
        },
    })
}
const addTaskFolder = async (data: TAddTaskFolderData) => {
    try {
        const res = await apiClient.post('/folders/create/', data)
        return castImmutable(res.data)
    } catch {
        throw new Error('addTaskFolder failed')
    }
}

export const useDeleteTaskFolder = () => {
    const queryClient = useGTQueryClient()
    return useMutation((data: { folderId: string }) => deleteTaskFolder(data), {
        onMutate: async (data: { folderId: string }) => {
            // cancel all current getTasks queries
            await queryClient.cancelQueries('tasks')

            const folders = queryClient.getImmutableQueryData<TTaskFolder[]>('tasks')
            if (!folders) return

            const newFolders = produce(folders, (draft) => {
                const folderIdx = draft.findIndex((s) => s.id === data.folderId)
                if (folderIdx === -1) return
                draft.splice(folderIdx, 1)
            })
            queryClient.setQueryData('tasks', newFolders)
        },
        onSettled: () => {
            queryClient.invalidateQueries('tasks')
        },
    })
}
const deleteTaskFolder = async (data: { folderId: string }) => {
    try {
        const res = await apiClient.delete(`/folders/delete/${data.folderId}/`)
        return castImmutable(res.data)
    } catch {
        throw new Error('deleteTaskFolder failed')
    }
}

export const useModifyTaskFolder = () => {
    const queryClient = useGTQueryClient()
    return useMutation((data: TModifyTaskFolderData) => modifyTaskFolder(data), {
        onMutate: async (data: TModifyTaskFolderData) => {
            // cancel all current getTasks queries
            await queryClient.cancelQueries('tasks')

            const folders = queryClient.getImmutableQueryData<TTaskFolder[]>('tasks')
            if (!folders) return

            const newFolders = produce(folders, (draft) => {
                const folderIndex = draft.findIndex((s) => s.id === data.folderId)
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
            queryClient.setQueryData('tasks', newFolders)
        },
        onSettled: () => {
            queryClient.invalidateQueries('tasks')
        },
    })
}
const modifyTaskFolder = async ({ folderId, name, id_ordering }: TModifyTaskFolderData) => {
    try {
        const res = await apiClient.patch(`/folders/modify/${folderId}/`, {
            name,
            id_ordering,
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('modifyTaskFolder failed')
    }
}

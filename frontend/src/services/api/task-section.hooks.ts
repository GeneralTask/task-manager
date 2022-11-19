import produce, { castImmutable } from 'immer'
import useQueryContext from '../../context/QueryContext'
import apiClient from '../../utils/api'
import { TTaskSection } from '../../utils/types'
import { arrayMoveInPlace } from '../../utils/utils'
import { useGTQueryClient, useQueuedMutation } from '../queryUtils'

interface TAddTaskSectionData {
    optimisticId: string
    name: string
    id_ordering?: number
}
interface TAddTaskSectionResponse {
    id: string
}
interface TDeleteSectionData {
    id: string
}
interface TModifyTaskSectionData {
    id: string
    name?: string
    id_ordering?: number
}

export const useAddTaskSection = () => {
    const queryClient = useGTQueryClient()
    const { setOptimisticId } = useQueryContext()

    return useQueuedMutation((data: TAddTaskSectionData) => addTaskSection(data), {
        tag: 'tasks',
        invalidateTagsOnSettled: ['tasks'],
        onMutate: async (data) => {
            await queryClient.cancelQueries('tasks')

            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            if (!sections) return
            const newSection: TTaskSection = {
                id: data.optimisticId,
                optimisticId: data.optimisticId,
                name: data.name,
                is_done: false,
                is_trash: false,
                tasks: [],
            }
            const newSections = produce(sections, (draft) => {
                draft.splice(sections.length - 1, 0, newSection)
            })
            queryClient.setQueryData('tasks', newSections)
        },
        onSuccess: ({ id }: TAddTaskSectionResponse, { optimisticId }) => {
            setOptimisticId(optimisticId, id)
        },
    })
}
const addTaskSection = async (data: TAddTaskSectionData) => {
    try {
        const res = await apiClient.post('/sections/create/', data)
        return castImmutable(res.data)
    } catch {
        throw new Error('addTaskSection failed')
    }
}

export const useDeleteTaskSection = () => {
    const queryClient = useGTQueryClient()
    return useQueuedMutation(({ id }: TDeleteSectionData) => deleteTaskSection(id), {
        tag: 'tasks',
        invalidateTagsOnSettled: ['tasks'],
        onMutate: async ({ id }) => {
            await queryClient.cancelQueries('tasks')

            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            if (!sections) return

            const newSections = produce(sections, (draft) => {
                const sectionIdx = draft.findIndex((s) => s.id === id)
                if (sectionIdx === -1) return
                draft.splice(sectionIdx, 1)
            })
            queryClient.setQueryData('tasks', newSections)
        },
    })
}
const deleteTaskSection = async (id: string) => {
    try {
        const res = await apiClient.delete(`/sections/delete/${id}/`)
        return castImmutable(res.data)
    } catch {
        throw new Error('deleteTaskSection failed')
    }
}

export const useModifyTaskSection = () => {
    const queryClient = useGTQueryClient()
    return useQueuedMutation((data: TModifyTaskSectionData) => modifyTaskSection(data), {
        tag: 'tasks',
        invalidateTagsOnSettled: ['tasks'],
        onMutate: async (data: TModifyTaskSectionData) => {
            // cancel all current getTasks queries
            await queryClient.cancelQueries('tasks')

            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            if (!sections) return

            const newSections = produce(sections, (draft) => {
                const sectionIndex = draft.findIndex((s) => s.id === data.id)
                if (sectionIndex === -1) return
                if (data.name) draft[sectionIndex].name = data.name
                if (data.id_ordering) {
                    let endIndex = data.id_ordering
                    if (sectionIndex < endIndex) {
                        endIndex -= 1
                    }
                    arrayMoveInPlace(draft, sectionIndex, endIndex)
                }
            })
            queryClient.setQueryData('tasks', newSections)
        },
    })
}
const modifyTaskSection = async ({ id, name, id_ordering }: TModifyTaskSectionData) => {
    try {
        const res = await apiClient.patch(`/sections/modify/${id}/`, {
            name,
            id_ordering,
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('modifyTaskSection failed')
    }
}

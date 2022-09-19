import { useMutation } from 'react-query'
import produce, { castImmutable } from 'immer'
import { TASK_SECTION_DEFAULT_ID } from '../../constants'
import apiClient from '../../utils/api'
import { TTaskSection } from '../../utils/types'
import { useGTQueryClient } from '../queryUtils'
import { arrayMoveInPlace } from '../../utils/utils'

interface TAddTaskSectionData {
    name: string
}

interface TModifyTaskSectionData {
    sectionId: string
    name?: string
    id_ordering?: number
}

export const useAddTaskSection = () => {
    const queryClient = useGTQueryClient()
    return useMutation((data: TAddTaskSectionData) => addTaskSection(data), {
        onMutate: async (data: TAddTaskSectionData) => {
            // cancel all current getTasks queries
            await queryClient.cancelQueries('tasks')

            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            if (!sections) return
            const newSection: TTaskSection = {
                id: TASK_SECTION_DEFAULT_ID,
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
        onSettled: () => {
            queryClient.invalidateQueries('tasks')
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
    return useMutation((data: { sectionId: string }) => deleteTaskSection(data), {
        onMutate: async (data: { sectionId: string }) => {
            // cancel all current getTasks queries
            await queryClient.cancelQueries('tasks')

            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            if (!sections) return

            const newSections = produce(sections, (draft) => {
                const sectionIdx = draft.findIndex((s) => s.id === data.sectionId)
                if (sectionIdx === -1) return
                draft.splice(sectionIdx, 1)
            })
            queryClient.setQueryData('tasks', newSections)
        },
        onSettled: () => {
            queryClient.invalidateQueries('tasks')
        },
    })
}
const deleteTaskSection = async (data: { sectionId: string }) => {
    try {
        const res = await apiClient.delete(`/sections/delete/${data.sectionId}/`)
        return castImmutable(res.data)
    } catch {
        throw new Error('deleteTaskSection failed')
    }
}

export const useModifyTaskSection = () => {
    const queryClient = useGTQueryClient()
    return useMutation((data: TModifyTaskSectionData) => modifyTaskSection(data), {
        onMutate: async (data: TModifyTaskSectionData) => {
            // cancel all current getTasks queries
            await queryClient.cancelQueries('tasks')

            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            if (!sections) return

            const newSections = produce(sections, (draft) => {
                const sectionIndex = draft.findIndex((s) => s.id === data.sectionId)
                if (sectionIndex === -1) return
                if (data.name) draft[sectionIndex].name = data.name
                if (data.id_ordering) {
                    let endIndex = data.id_ordering - 1
                    if (sectionIndex < endIndex) {
                        endIndex -= 1
                    }
                    arrayMoveInPlace(draft, sectionIndex, endIndex)
                }
            })
            queryClient.setQueryData('tasks', newSections)
        },
        onSettled: () => {
            queryClient.invalidateQueries('tasks')
        },
    })
}
const modifyTaskSection = async ({ sectionId, name, id_ordering }: TModifyTaskSectionData) => {
    try {
        const res = await apiClient.patch(`/sections/modify/${sectionId}/`, {
            name,
            id_ordering,
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('modifyTaskSection failed')
    }
}

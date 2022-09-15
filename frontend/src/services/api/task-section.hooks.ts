import { useMutation } from 'react-query'
import produce, { castImmutable } from 'immer'
import { TASK_SECTION_DEFAULT_ID } from '../../constants'
import apiClient from '../../utils/api'
import { TTaskSection } from '../../utils/types'
import { useGTQueryClient } from '../queryUtils'

interface TAddTaskSectionData {
    name: string
}

interface TModifyTaskSectionData {
    sectionId: string
    name: string
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
                const section = draft.find((s) => s.id === data.sectionId)
                if (section) {
                    section.name = data.name
                }
            })
            queryClient.setQueryData('tasks', newSections)
        },
    })
}
const modifyTaskSection = async (data: TModifyTaskSectionData) => {
    try {
        const res = await apiClient.patch(`/sections/modify/${data.sectionId}/`, { name: data.name })
        return castImmutable(res.data)
    } catch {
        throw new Error('modifyTaskSection failed')
    }
}

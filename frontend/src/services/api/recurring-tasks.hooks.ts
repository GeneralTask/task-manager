import { QueryFunctionContext, useQuery } from 'react-query'
import produce, { castImmutable } from 'immer'
import useQueryContext from '../../context/QueryContext'
import apiClient from '../../utils/api'
import { TRecurringTaskTemplate } from '../../utils/types'
import { useGTQueryClient, useQueuedMutation } from '../queryUtils'

interface TCreateRecurringTaskPayload {
    title: string
    body: string
    id_task_section: string
    priority_normalized: number
    recurrence_rate: number
    time_of_day_seconds_to_create_task: number
    day_to_create_task: number
    optimisticId: string
}
interface TCreateRecurringTaskResponse {
    template_id: string
}
interface TModifyRecurringTaskPayload {
    id: string
    title?: string
    body?: string
    id_task_section?: string
    priority_normalized?: number
    recurrence_rate?: number
    time_of_day_seconds_to_create_task?: number
    day_to_create_task?: number
}

export const useRecurringTaskTemplates = () => {
    return useQuery<TRecurringTaskTemplate[], void>('recurring-tasks', getRecurringTaskTemplates)
}

const getRecurringTaskTemplates = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/recurring_task_templates/', {
            signal,
        })
        // the backend currently returns null if the list is empty - will change once this is fixed
        if (res.data === null) return []
        return castImmutable(res.data)
    } catch {
        throw new Error('getRecurringTaskTemplates failed')
    }
}

export const useCreateRecurringTask = () => {
    const queryClient = useGTQueryClient()
    const { setOptimisticId } = useQueryContext()

    return useQueuedMutation((payload: TCreateRecurringTaskPayload) => createRecurringTask(payload), {
        tag: 'recurring-tasks',
        invalidateTagsOnSettled: ['recurring-tasks'],
        onMutate: async (payload) => {
            await queryClient.cancelQueries('recurring-tasks')

            const recurringTasks = queryClient.getImmutableQueryData<TRecurringTaskTemplate[]>('recurring-tasks')
            if (!recurringTasks) return

            const newRecurringTasks = produce(recurringTasks, (draft) => {
                const newRecurringTask: TRecurringTaskTemplate = {
                    ...payload,
                    id: payload.optimisticId,
                }
                draft.push(newRecurringTask)
            })
            queryClient.setQueryData('recurring-tasks', newRecurringTasks)
        },
        onSuccess: (response: TCreateRecurringTaskResponse, payload) => {
            setOptimisticId(payload.optimisticId, response.template_id)
        },
    })
}

const createRecurringTask = async (payload: TCreateRecurringTaskPayload) => {
    try {
        const res = await apiClient.post('/recurring_task_templates/create/', payload)
        return castImmutable(res.data)
    } catch {
        throw new Error('getRecurringTaskTemplates failed')
    }
}

export const useModifyRecurringTask = () => {
    const queryClient = useGTQueryClient()

    useQueuedMutation((payload: TModifyRecurringTaskPayload) => modifyRecurringTask(payload), {
        tag: 'recurring-tasks',
        invalidateTagsOnSettled: ['recurring-tasks'],
        onMutate: async (payload) => {
            await queryClient.cancelQueries('recurring-tasks')

            const recurringTasks = queryClient.getImmutableQueryData<TRecurringTaskTemplate[]>('recurring-tasks')
            if (!recurringTasks) return

            const newRecurringTasks = produce(recurringTasks, (draft) => {
                const recurringTask = draft.find((recurringTask) => recurringTask.id === payload.id)
                if (!recurringTask) return
                recurringTask.title = payload.title || recurringTask.title
                recurringTask.body = payload.body || recurringTask.body
                recurringTask.id_task_section = payload.id_task_section || recurringTask.id_task_section
                recurringTask.priority_normalized = payload.priority_normalized || recurringTask.priority_normalized
                recurringTask.recurrence_rate = payload.recurrence_rate || recurringTask.recurrence_rate
                recurringTask.time_of_day_seconds_to_create_task =
                    payload.time_of_day_seconds_to_create_task || recurringTask.time_of_day_seconds_to_create_task
                recurringTask.day_to_create_task = payload.day_to_create_task || recurringTask.day_to_create_task
            })
            queryClient.setQueryData('recurring-tasks', newRecurringTasks)
        },
    })
}

const modifyRecurringTask = async (payload: TModifyRecurringTaskPayload) => {
    try {
        const res = await apiClient.post(`/recurring_task_templates/modify/${payload.id}/`, payload)
        return castImmutable(res.data)
    } catch {
        throw new Error('getRecurringTaskTemplates failed')
    }
}

export const backfillRecurringTaskTemplates = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/recurring_task_templates/backfill_tasks/', {
            signal,
        })
        return castImmutable<TRecurringTaskTemplate[]>(res.data)
    } catch {
        throw new Error('getRecurringTaskTemplates failed')
    }
}

import { QueryFunctionContext, useQuery } from '@tanstack/react-query'
import produce, { castImmutable } from 'immer'
import { DateTime } from 'luxon'
import { BACKFILL_RECURRING_TASKS_INTERVAL } from '../../constants'
import useQueryContext from '../../context/QueryContext'
import apiClient from '../../utils/api'
import { RecurrenceRate } from '../../utils/enums'
import { TRecurringTaskTemplate, TTaskV4 } from '../../utils/types'
import { getBackgroundQueryOptions, useGTMutation, useGTQueryClient } from '../queryUtils'
import { useModifyTask } from './tasks.hooks'

interface TCreateRecurringTaskPayload {
    optimisticId: string
    title: string
    id_task_section: string
    time_of_day_seconds_to_create_task: number
    recurrence_rate: RecurrenceRate
    body?: string
    priority_normalized?: number
    day_to_create_task?: number
    month_to_create_task?: number
    task_id?: string
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
    recurrence_rate?: RecurrenceRate
    time_of_day_seconds_to_create_task?: number
    day_to_create_task?: number
    month_to_create_task?: number
    is_enabled?: boolean
    is_deleted?: boolean
}

export const useRecurringTaskTemplates = () => {
    return useQuery<TRecurringTaskTemplate[], void>(
        ['recurring-tasks'],
        getRecurringTaskTemplates,
        getBackgroundQueryOptions()
    )
}

const getRecurringTaskTemplates = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/recurring_task_templates/v2/', {
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
    const { mutate: modifyTask } = useModifyTask()

    return useGTMutation((payload: TCreateRecurringTaskPayload) => createRecurringTask(payload), {
        tag: ['recurring-tasks'],
        invalidateTagsOnSettled: [['recurring-tasks']],
        onMutate: async (payload) => {
            await Promise.all([queryClient.cancelQueries(['recurring-tasks']), queryClient.cancelQueries(['tasks'])])

            const recurringTasks = queryClient.getImmutableQueryData<TRecurringTaskTemplate[]>(['recurring-tasks'])
            if (!recurringTasks) return

            const newRecurringTasks = produce(recurringTasks, (draft) => {
                const newRecurringTask: TRecurringTaskTemplate = {
                    ...payload,
                    id: payload.optimisticId,
                    last_backfill_datetime: '',
                    created_at: DateTime.utc().toISO(),
                    updated_at: DateTime.utc().toISO(),
                    is_deleted: false,
                    is_enabled: true,
                }
                draft.unshift(newRecurringTask)
            })
            queryClient.setQueryData(['recurring-tasks'], newRecurringTasks)

            if (payload.task_id) {
                const allTasks = queryClient.getImmutableQueryData<TTaskV4[]>(['tasks_v4'])
                if (!allTasks) return

                const updatedTasks = produce(allTasks, (draft) => {
                    const task = draft.find((t) => t.id === payload.task_id)
                    if (!task) return
                    task.recurring_task_template_id = payload.optimisticId
                })
                queryClient.setQueryData(['tasks_v4'], updatedTasks)
            }
        },
        onSuccess: (response: TCreateRecurringTaskResponse, payload) => {
            setOptimisticId(payload.optimisticId, response.template_id)

            if (payload.task_id) {
                modifyTask({
                    id: payload.task_id,
                    recurringTaskTemplateId: response.template_id,
                })
            }
            const recurringTasks = queryClient.getImmutableQueryData<TRecurringTaskTemplate[]>(['recurring-tasks'])
            if (!recurringTasks) return

            const newRecurringTasks = produce(recurringTasks, (draft) => {
                const recurringTaskTemplate = draft.find((rt) => rt.id === payload.optimisticId)
                if (!recurringTaskTemplate) return
                recurringTaskTemplate.id = response.template_id
            })
            queryClient.setQueryData(['recurring-tasks'], newRecurringTasks)
        },
    })
}

const createRecurringTask = async (payload: TCreateRecurringTaskPayload) => {
    try {
        const res = await apiClient.post('/recurring_task_templates/create/', payload)
        return castImmutable(res.data)
    } catch {
        throw new Error('createRecurringTask failed')
    }
}

export const useModifyRecurringTask = () => {
    const queryClient = useGTQueryClient()

    return useGTMutation((payload: TModifyRecurringTaskPayload) => modifyRecurringTask(payload), {
        tag: ['recurring-tasks'],
        invalidateTagsOnSettled: [['recurring-tasks']],
        onMutate: async (payload) => {
            await queryClient.cancelQueries(['recurring-tasks'])

            const recurringTasks = queryClient.getImmutableQueryData<TRecurringTaskTemplate[]>(['recurring-tasks'])
            if (!recurringTasks) return

            const newRecurringTasks = produce(recurringTasks, (draft) => {
                const recurringTask = draft.find((recurringTask) => recurringTask.id === payload.id)
                if (!recurringTask) return
                recurringTask.title = payload.title ?? recurringTask.title
                recurringTask.body = payload.body ?? recurringTask.body
                recurringTask.id_task_section = payload.id_task_section ?? recurringTask.id_task_section
                recurringTask.priority_normalized = payload.priority_normalized ?? recurringTask.priority_normalized
                recurringTask.recurrence_rate = payload.recurrence_rate ?? recurringTask.recurrence_rate
                recurringTask.time_of_day_seconds_to_create_task =
                    payload.time_of_day_seconds_to_create_task ?? recurringTask.time_of_day_seconds_to_create_task
                recurringTask.day_to_create_task = payload.day_to_create_task ?? recurringTask.day_to_create_task
                recurringTask.month_to_create_task = payload.month_to_create_task ?? recurringTask.month_to_create_task
                recurringTask.is_enabled = payload.is_enabled ?? recurringTask.is_enabled
                recurringTask.is_deleted = payload.is_deleted ?? recurringTask.is_deleted
                recurringTask.updated_at = DateTime.utc().toISO()
            })
            queryClient.setQueryData(['recurring-tasks'], newRecurringTasks)
        },
    })
}

const modifyRecurringTask = async (payload: TModifyRecurringTaskPayload) => {
    try {
        const res = await apiClient.patch(`/recurring_task_templates/modify/${payload.id}/`, payload)
        return castImmutable(res.data)
    } catch {
        throw new Error('modifyRecurringTask failed')
    }
}

export const useBackfillRecurringTasks = () => {
    return useQuery(
        ['backfill-recurring-tasks'],
        backfillRecurringTasks,
        getBackgroundQueryOptions(BACKFILL_RECURRING_TASKS_INTERVAL, BACKFILL_RECURRING_TASKS_INTERVAL)
    )
}

const backfillRecurringTasks = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/recurring_task_templates/backfill_tasks/', {
            signal,
        })
        return castImmutable<TRecurringTaskTemplate[]>(res.data)
    } catch {
        throw new Error('backfillRecurringTaskTemplates failed')
    }
}

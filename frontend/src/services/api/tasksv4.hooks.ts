import { QueryFunctionContext, useQuery } from 'react-query'
import { castImmutable } from 'immer'
import apiClient from '../../utils/api'
import { TTaskV4 } from '../../utils/types'

export const useGetTasksV4 = (isEnabled = true) => {
    return useQuery<TTaskV4[], void>('tasks_v4', getTasksV4, { enabled: isEnabled, refetchOnMount: false })
}
const getTasksV4 = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/tasks/v4/', { signal })
        return castImmutable(res.data)
    } catch {
        throw new Error('getTasks failed')
    }
}

export const createNewTaskV4Helper = (data: Partial<TTaskV4> & { optimisticId: string; title: string }): TTaskV4 => {
    return {
        id: data.optimisticId,
        optimisticId: data.optimisticId,
        id_ordering: data.id_ordering ?? 0.5,
        title: data.title,
        deeplink: data.deeplink ?? '',
        body: data.body ?? '',
        priority_normalized: data.priority_normalized ?? 0,
        due_date: data.due_date ?? '',
        source: data.source ?? {
            name: 'General Task',
            logo: 'generaltask',
            logo_v2: 'generaltask',
            is_completable: false,
            is_replyable: false,
        },
        sender: data.sender ?? '',
        is_done: data.is_done ?? false,
        is_deleted: data.is_deleted ?? false,
        created_at: data.created_at ?? '',
        updated_at: data.updated_at ?? '',
        id_folder: data.id_folder ?? '',
        id_nux_number: data.id_nux_number,
        id_parent: data.id_parent,
        subtask_ids: data.subtask_ids,
        meeting_preparation_params: data.meeting_preparation_params,
        slack_message_params: data.slack_message_params,
        comments: data.comments,
        external_status: data.external_status,
        all_statuses: data.all_statuses,
    }
}

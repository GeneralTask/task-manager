import { QueryFunctionContext, useQuery } from 'react-query'
import produce, { castImmutable } from 'immer'
import useQueryContext from '../../context/QueryContext'
import apiClient from '../../utils/api'
import { TTaskV4 } from '../../utils/types'
import { useGTMutation, useGTQueryClient } from '../queryUtils'
import { TCreateTaskData, TCreateTaskResponse } from './tasks.hooks'

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

export const useCreateTaskV4 = () => {
    const queryClient = useGTQueryClient()
    const { setOptimisticId } = useQueryContext()
    return useGTMutation((data: TCreateTaskData) => createTask(data), {
        tag: 'tasks',
        invalidateTagsOnSettled: ['tasks', 'tasks_v4', 'overview'],
        onMutate: async (data: TCreateTaskData) => {
            await Promise.all([
                queryClient.cancelQueries('overview-supported-views'),
                queryClient.cancelQueries('overview'),
                queryClient.cancelQueries('tasks'),
                queryClient.cancelQueries('tasks_v4'),
            ])
            const tasks_v4 = queryClient.getImmutableQueryData<TTaskV4[]>('tasks_v4')
            if (tasks_v4) {
                const updatedTasks = produce(tasks_v4, (draft) => {
                    const { optimisticId, taskSectionId, title, body, parent_task_id } = data
                    const newTask = createNewTaskV4Helper({
                        // map to v4, remove when v3 is removed.
                        id: optimisticId,
                        // We're setting id_folder instead of putting the task into a folder directly now
                        id_folder: taskSectionId,
                        // Need to set this if it is a subtask
                        id_parent: parent_task_id,
                        optimisticId,
                        title,
                        body,
                    })
                    draft.unshift(newTask)
                    // Add the id of this new task to the parent's subtask_ids
                    if (data.parent_task_id) {
                        const parentTask = draft.find((task) => task.id === data.parent_task_id)
                        if (parentTask) parentTask.subtask_ids = [data.optimisticId, ...(parentTask.subtask_ids || [])]
                    }
                })
                queryClient.setQueryData('tasks_v4', updatedTasks)
            }
        },
        onSuccess: async (response: TCreateTaskResponse, createData: TCreateTaskData) => {
            setOptimisticId(createData.optimisticId, response.task_id)

            const tasks_v4 = queryClient.getImmutableQueryData<TTaskV4[]>('tasks_v4')

            if (tasks_v4) {
                const updatedTasks = produce(tasks_v4, (draft) => {
                    const task = draft.find((task) => task.id === createData.optimisticId)
                    if (!task?.id) return
                    task.id = response.task_id
                    task.optimisticId = undefined
                })
                queryClient.setQueryData('tasks_v4', updatedTasks)
            }
        },
    })
}
export const createTask = async (data: TCreateTaskData) => {
    try {
        const res = await apiClient.post('/tasks/create/gt_task/', {
            title: data.title,
            body: data.body ?? '',
            id_task_section: data.taskSectionId,
            parent_task_id: data.parent_task_id,
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('createTask failed')
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

import { QueryFunctionContext, useQuery } from 'react-query'
import produce, { castImmutable } from 'immer'
import useQueryContext from '../../context/QueryContext'
import apiClient from '../../utils/api'
import { TTaskV4 } from '../../utils/types'
import { createNewTaskV4Helper } from '../../utils/utils'
import { useGTQueryClient, useQueuedMutation } from '../queryUtils'
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
    return useQueuedMutation((data: TCreateTaskData) => createTask(data), {
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

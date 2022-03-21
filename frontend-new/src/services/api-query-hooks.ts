import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from 'react-query'
import { MESSAGES_PER_PAGE } from '../constants'
import { apiClient } from '../utils/api'
import { TMessage, TTask, TTaskModifyRequestBody, TTaskSection, TUserInfo } from '../utils/types'

/**
 * TASKS QUERIES
 */

export const useGetTasks = () => {
    return useQuery<TTaskSection[], void>('tasks', getTasks)
}
const getTasks = async () => {
    try {
        const res = await apiClient.get('/tasks/v3/')
        return res.data
    } catch {
        throw new Error('getTasks failed')
    }
}

export const useCreateTask = () => {
    const queryClient = useQueryClient()
    return useMutation((newTaskData: { title: string, body: string, id_task_section: string }) => createTask(newTaskData),
        {
            onMutate: async (newTaskData: { title: string, body: string, id_task_section: string }) => {
                // cancel all current getTasks queries
                await queryClient.cancelQueries('tasks')

                const sections: TTaskSection[] = queryClient.getQueryData('tasks') || []
                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i]
                    if (section.id === newTaskData.id_task_section) {
                        const newTask: TTask = {
                            id: '0',
                            id_ordering: 0,
                            title: newTaskData.title,
                            body: newTaskData.body,
                            deeplink: '',
                            sent_at: '',
                            time_allocated: 0,
                            due_date: '',
                            source: {
                                name: 'General Task',
                                logo: '',
                                logo_v2: 'generaltask',
                                is_completable: false,
                                is_replyable: false,
                            },
                            sender: '',
                            is_done: false,
                        }
                        section.tasks = [newTask, ...section.tasks]
                    }
                }
                console.log(sections)
                queryClient.setQueryData('tasks', () => sections)

                console.log(queryClient.getQueryData('tasks'))
                return { sections }
            },
            onSettled: () => {
                queryClient.invalidateQueries('tasks')
                console.log('onSettled')
            }
        }
    )
}
const createTask = async (newTaskData: { title: string, body: string, id_task_section: string }) => {
    try {
        const res = await apiClient.post('/tasks/create/gt_task/', newTaskData)
        return res.data
    } catch {
        throw new Error('createTask failed')
    }
}

export const useModifyTask = () => {
    const queryClient = useQueryClient()
    return useMutation((taskData: { id: string, title?: string, due_date?: string, time_duration?: number, body?: string }) => modifyTask(taskData),
        {
            onMutate: async (taskData: { id: string, title?: string, due_date?: string, time_duration?: number, body?: string }) => {
                // cancel all current getTasks queries
                await queryClient.cancelQueries('tasks')

                const sections: TTaskSection[] = queryClient.getQueryData('tasks') || []
                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i]
                    for (let j = 0; j < section.tasks.length; j++) {
                        const task = section.tasks[j]
                        if (task.id === taskData.id) {
                            task.title = taskData.title || task.title
                            task.due_date = taskData.due_date || task.due_date
                            task.time_allocated = taskData.time_duration || task.time_allocated
                            task.body = taskData.body || task.body
                        }
                    }
                }
                queryClient.setQueryData('tasks', () => sections)
            },
            onSettled: () => {
                queryClient.invalidateQueries('tasks')
            }
        }
    )
}
const modifyTask = async (taskData: { id: string, title?: string, due_date?: string, time_duration?: number, body?: string }) => {
    const requestBody: TTaskModifyRequestBody = {}
    if (taskData.title) requestBody.title = taskData.title
    if (taskData.due_date) requestBody.due_date = taskData.due_date
    if (taskData.time_duration) requestBody.time_duration = taskData.time_duration
    if (taskData.body) requestBody.body = taskData.body
    try {
        const res = await apiClient.patch(`/tasks/modify/${taskData.id}/`, requestBody)
        return res.data
    } catch {
        throw new Error('modifyTask failed')
    }
}


export const useMarkTaskDone = () => {
    const queryClient = useQueryClient()
    return useMutation((taskData: { taskId: string, isCompleted: boolean }) => markTaskDone(taskData),
        {
            onMutate: async (taskData: { taskId: string, isCompleted: boolean }) => {
                // cancel all current getTasks queries
                await queryClient.cancelQueries('tasks')

                const sections: TTaskSection[] = queryClient.getQueryData('tasks') || []
                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i]
                    for (let j = 0; j < section.tasks.length; j++) {
                        const task = section.tasks[j]
                        if (task.id === taskData.taskId) {
                            task.is_done = taskData.isCompleted
                            // Don't actually remove tasks from the list, just mark them as done (Until refreshing)
                            // section.tasks.splice(j, 1)
                        }
                    }
                }
                queryClient.setQueryData('tasks', sections)
            },
            // onSettled: () => {
            //     queryClient.invalidateQueries('tasks')
            // }
        }
    )
}

const markTaskDone = async (taskData: { taskId: string, isCompleted: boolean }) => {
    try {
        const res = await apiClient.patch(`/tasks/modify/${taskData.taskId}/`, { is_completed: taskData.isCompleted })
        return res.data
    } catch {
        throw new Error('markTaskDone failed')
    }
}
/**
 * MESSAGES QUERIES
 */
export const useGetInfiniteMessages = () => {
    return useInfiniteQuery<TMessage[], void>('messages', getInfiniteMessages,
        {
            getNextPageParam: (_, pages) => pages.length + 1,
        }
    )
}
const getInfiniteMessages = async ({ pageParam = 1 }) => {
    try {
        const res = await apiClient.get(`/messages/v2/?page=${pageParam}&limit=${MESSAGES_PER_PAGE}`)
        return res.data
    } catch {
        throw new Error('getInfiniteMessages failed')
    }
}

export const useFetchMessages = () => {
    const queryClient = useQueryClient()
    return useQuery([], fetchMessages, {
        onSuccess: () => {
            queryClient.invalidateQueries('messages')
        },
    })
}
const fetchMessages = async () => {
    try {
        const res = await apiClient.get('/messages/fetch/')
        return res.data
    } catch {
        throw new Error('fetchMessages failed')
    }
}

/**
 * USER INFO QUERIES
 */
export const useGetUserInfo = () => {
    return useQuery('user_info', getUserInfo)
}
const getUserInfo = async () => {
    try {
        const res = await apiClient.get('/user_info/')
        return res.data
    } catch {
        throw new Error('getUserInfo failed')
    }
}

export const mutateUserInfo = async (userInfo: TUserInfo) => {
    try {
        const res = await apiClient.patch('/user_info/', JSON.stringify(userInfo))
        return res.data
    } catch {
        throw new Error('mutateUserInfo failed')
    }
}

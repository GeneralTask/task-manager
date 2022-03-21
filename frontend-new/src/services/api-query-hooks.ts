import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from 'react-query'
import { MESSAGES_PER_PAGE } from '../constants'
import { apiClient } from '../utils/api'
import { TMessage, TTask, TTaskModifyRequestBody, TTaskSection, TUserInfo } from '../utils/types'
import { arrayMoveInPlace, resetOrderingIds } from '../utils/utils'

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


export const useFetchExternalTasks = () => {
    return useQuery('tasksExternal', fetchExternalTasks)
}
const fetchExternalTasks = async () => {
    try {
        const res = await apiClient.get('/tasks/fetch/')
        return res.data
    } catch {
        throw new Error('fetchTasks failed')
    }
}


export const useCreateTask = () => {
    const queryClient = useQueryClient()
    return useMutation((newdata: { title: string, body: string, id_task_section: string }) => createTask(newdata),
        {
            onMutate: async (newdata: { title: string, body: string, id_task_section: string }) => {
                // cancel all current getTasks queries
                await queryClient.cancelQueries('tasks')

                const sections: TTaskSection[] | undefined = queryClient.getQueryData('tasks')
                if (!sections) return

                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i]
                    if (section.id === newdata.id_task_section) {
                        const newTask: TTask = {
                            id: '0',
                            id_ordering: 0,
                            title: newdata.title,
                            body: newdata.body,
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
const createTask = async (newdata: { title: string, body: string, id_task_section: string }) => {
    try {
        const res = await apiClient.post('/tasks/create/gt_task/', newdata)
        return res.data
    } catch {
        throw new Error('createTask failed')
    }
}


export const useModifyTask = () => {
    const queryClient = useQueryClient()
    return useMutation((data: { id: string, title?: string, due_date?: string, time_duration?: number, body?: string }) => modifyTask(data),
        {
            onMutate: async (data: { id: string, title?: string, due_date?: string, time_duration?: number, body?: string }) => {
                // cancel all current getTasks queries
                await queryClient.cancelQueries('tasks')

                const sections: TTaskSection[] | undefined = queryClient.getQueryData('tasks')
                if (!sections) return

                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i]
                    for (let j = 0; j < section.tasks.length; j++) {
                        const task = section.tasks[j]
                        if (task.id === data.id) {
                            task.title = data.title || task.title
                            task.due_date = data.due_date || task.due_date
                            task.time_allocated = data.time_duration || task.time_allocated
                            task.body = data.body || task.body
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
const modifyTask = async (data: { id: string, title?: string, due_date?: string, time_duration?: number, body?: string }) => {
    const requestBody: TTaskModifyRequestBody = {}
    if (data.title) requestBody.title = data.title
    if (data.due_date) requestBody.due_date = data.due_date
    if (data.time_duration) requestBody.time_duration = data.time_duration
    if (data.body) requestBody.body = data.body
    try {
        const res = await apiClient.patch(`/tasks/modify/${data.id}/`, requestBody)
        return res.data
    } catch {
        throw new Error('modifyTask failed')
    }
}


export const useMarkTaskDone = () => {
    const queryClient = useQueryClient()
    return useMutation((data: { taskId: string, isCompleted: boolean }) => markTaskDone(data),
        {
            onMutate: async (data: { taskId: string, isCompleted: boolean }) => {
                // cancel all current getTasks queries
                await queryClient.cancelQueries('tasks')

                const sections: TTaskSection[] | undefined = queryClient.getQueryData('tasks')
                if (!sections) return

                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i]
                    for (let j = 0; j < section.tasks.length; j++) {
                        const task = section.tasks[j]
                        if (task.id === data.taskId) {
                            task.is_done = data.isCompleted
                            // Don't actually remove tasks from the list, just mark them as done (Until refreshing)
                            // section.tasks.splice(j, 1)
                        }
                    }
                }
                queryClient.setQueryData('tasks', sections)
            }
        }
    )
}
const markTaskDone = async (data: { taskId: string, isCompleted: boolean }) => {
    try {
        const res = await apiClient.patch(`/tasks/modify/${data.taskId}/`, { is_completed: data.isCompleted })
        return res.data
    } catch {
        throw new Error('markTaskDone failed')
    }
}


export const useReorderTask = () => {
    const queryClient = useQueryClient()
    return useMutation((data: { taskId: string, dropSectionId: string, orderingId: number, dragSectionId?: string }) => reorderTask(data),
        {
            onMutate: async (data: { taskId: string, dropSectionId: string, orderingId: number, dragSectionId?: string }) => {
                // cancel all current getTasks queries
                await queryClient.cancelQueries('tasks')

                const sections: TTaskSection[] | undefined = queryClient.getQueryData('tasks')
                if (!sections) return
                if (data.dragSectionId === undefined || data.dragSectionId === data.dropSectionId) {
                    const section = sections.find(s => s.id === data.dropSectionId)
                    if (section == null) return
                    const startIndex = section.tasks.findIndex(t => t.id === data.taskId)
                    if (startIndex === -1) return
                    let endIndex = data.orderingId - 1
                    if (startIndex < endIndex) {
                        endIndex -= 1
                    }
                    arrayMoveInPlace(section.tasks, startIndex, endIndex)

                    // update ordering ids
                    resetOrderingIds(section.tasks)
                }
                // move task from one section to the other
                else {
                    // remove task from old location
                    const dragSection = sections.find((section) => section.id === data.dragSectionId)
                    if (dragSection == null) return
                    const dragTaskIndex = dragSection.tasks.findIndex((task) => task.id === data.taskId)
                    if (dragTaskIndex === -1) return
                    const dragTask = dragSection.tasks[dragTaskIndex]
                    dragSection.tasks.splice(dragTaskIndex, 1)

                    // add task to new location
                    const dropSection = sections.find((section) => section.id === data.dropSectionId)
                    if (dropSection == null) return
                    dropSection.tasks.splice(data.orderingId - 1, 0, dragTask)

                    // update ordering ids
                    // resetOrderingIds(dropSection.tasks)
                    resetOrderingIds(dragSection.tasks)
                }
                queryClient.setQueryData('tasks', sections)
            }
        }
    )
}
const reorderTask = async (data: { taskId: string, dropSectionId: string, orderingId: number, dragSectionId?: string }) => {
    try {
        const res = await apiClient.patch(`/tasks/modify/${data.taskId}/`, { id_task_section: data.dropSectionId, id_ordering: data.orderingId })
        return res.data
    } catch {
        throw new Error('reorderTask failed')
    }
}


/**
 * TASK SECTION QUERIES
 */

export const useAddTaskSection = () => {
    const queryClient = useQueryClient()
    return useMutation((data: { name: string }) => addTaskSection(data),
        {
            onMutate: async (data: { name: string }) => {
                // cancel all current getTasks queries
                await queryClient.cancelQueries('tasks')

                const sections: TTaskSection[] | undefined = queryClient.getQueryData('tasks')
                if (!sections) return
                const newSection: TTaskSection = {
                    id: '-1',
                    name: data.name,
                    is_done: false,
                    tasks: [],
                }
                sections.splice(sections.length - 1, 0, newSection)
                queryClient.setQueryData('tasks', sections)
            },
            onSettled: () => {
                queryClient.invalidateQueries('tasks')
            }
        }
    )
}
const addTaskSection = async (data: { name: string }) => {
    try {
        const res = await apiClient.post('/sections/create/', { name: data.name })
        return res.data
    } catch {
        throw new Error('addTaskSection failed')
    }
}


export const useDeleteTaskSection = () => {
    const queryClient = useQueryClient()
    return useMutation((data: { sectionId: string }) => deleteTaskSection(data),
        {
            onMutate: async (data: { sectionId: string }) => {
                // cancel all current getTasks queries
                await queryClient.cancelQueries('tasks')

                const sections: TTaskSection[] | undefined = queryClient.getQueryData('tasks')
                if (!sections) return
                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i]
                    if (section.id === data.sectionId) {
                        sections.splice(i, 1)
                        return
                    }
                }
                queryClient.setQueryData('tasks', sections)
            },
            onSettled: () => {
                queryClient.invalidateQueries('tasks')
            }
        }
    )
}
const deleteTaskSection = async (data: { sectionId: string }) => {
    try {
        const res = await apiClient.delete(`/sections/delete/${data.sectionId}/`)
        return res.data
    } catch {
        throw new Error('deleteTaskSection failed')
    }
}


export const useModifyTaskSection = () => {
    const queryClient = useQueryClient()
    return useMutation((data: { sectionId: string, name: string }) => modifyTaskSection(data),
        {
            onMutate: async (data: { sectionId: string, name: string }) => {
                // cancel all current getTasks queries
                await queryClient.cancelQueries('tasks')

                const sections: TTaskSection[] | undefined = queryClient.getQueryData('tasks')
                if (!sections) return

                for (let i = 0; i < sections.length; i++) {
                    const section = sections[i]
                    if (section.id === data.sectionId) {
                        section.name = data.name
                    }
                }
                queryClient.setQueryData('tasks', sections)
            }
        }
    )
}
const modifyTaskSection = async (data: { sectionId: string, name: string }) => {
    try {
        const res = await apiClient.patch(`/sections/modify/${data.sectionId}/`, { name: data.name })
        return res.data
    } catch {
        throw new Error('modifyTaskSection failed')
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

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from 'react-query'
import { MESSAGES_PER_PAGE } from '../constants'
import apiClient from '../utils/api'
import { TEvent, TLinkedAccount, TMessage, TSupportedType, TTask, TTaskModifyRequestBody, TTaskSection, TUserInfo } from '../utils/types'
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
    return useMutation((data: { title: string, body: string, id_task_section: string }) => createTask(data),
        {
            onMutate: async (data: { title: string, body: string, id_task_section: string }) => {
                // cancel all current getTasks queries
                await queryClient.cancelQueries('tasks')

                const sections: TTaskSection[] | undefined = queryClient.getQueryData('tasks')
                if (!sections) return

                for (const section of sections) {
                    if (section.id === data.id_task_section) {
                        const newTask: TTask = {
                            id: '0',
                            id_ordering: 0,
                            title: data.title,
                            body: data.body,
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
                        queryClient.setQueryData('tasks', () => sections)
                        return
                    }
                }
            },
            onSettled: () => {
                queryClient.invalidateQueries('tasks')
            }
        }
    )
}
const createTask = async (data: { title: string, body: string, id_task_section: string }) => {
    try {
        const res = await apiClient.post('/tasks/create/gt_task/', data)
        return res.data
    } catch {
        throw new Error('createTask failed')
    }
}


export const useModifyTask = () => {
    const queryClient = useQueryClient()
    return useMutation((data: { id: string, title?: string, dueDate?: string, timeAllocated?: number, body?: string }) => modifyTask(data),
        {
            onMutate: async (data: { id: string, title?: string, dueDate?: string, timeAllocated?: number, body?: string }) => {
                // cancel all current getTasks queries
                await queryClient.cancelQueries('tasks')

                const sections: TTaskSection[] | undefined = queryClient.getQueryData('tasks')
                if (!sections) return

                for (const section of sections) {
                    for (const task of section.tasks) {
                        if (task.id === data.id) {
                            task.title = data.title || task.title
                            task.due_date = data.dueDate || task.due_date
                            task.time_allocated = data.timeAllocated || task.time_allocated
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
const modifyTask = async (data: { id: string, title?: string, dueDate?: string, timeAllocated?: number, body?: string }) => {
    const requestBody: TTaskModifyRequestBody = {}
    if (data.title) requestBody.title = data.title
    if (data.dueDate) requestBody.due_date = data.dueDate
    if (data.timeAllocated) requestBody.time_duration = data.timeAllocated
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

                for (const section of sections) {
                    for (const task of section.tasks) {
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
                // move within the existing section
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

                for (const section of sections) {
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
    return useQuery([], () => fetchMessages(),
        {
            onSettled: () => {
                queryClient.invalidateQueries('messages')
            },
        }
    )
}
const fetchMessages = async () => {
    try {
        const res = await apiClient.get('/messages/fetch/')
        return res.data
    } catch {
        throw new Error('fetchMessages failed')
    }
}


export const useMarkMessageRead = () => {
    const queryClient = useQueryClient()
    return useMutation((data: { id: string, isRead: boolean }) => markMessageRead(data),
        {
            onSettled: (_, error, variables) => {
                if (error) return
                queryClient.invalidateQueries(['messages', variables.id])
            }
        }
    )
}
const markMessageRead = async (data: { id: string, isRead: boolean }) => {
    try {
        const res = await apiClient.patch(`/messages/modify/${data.id}/`, { is_read: data.isRead })
        return res.data
    } catch {
        throw new Error('markMessageRead failed')
    }
}


export const useMarkMessageAsTask = () => {
    const queryClient = useQueryClient()
    return useMutation((data: { id: string, isTask: boolean }) => markMessageAsTask(data),
        {
            onSettled: () => {
                queryClient.invalidateQueries('tasks')
            }
        }
    )
}
const markMessageAsTask = async (data: { id: string, isTask: boolean }) => {
    try {
        const res = await apiClient.patch(`/messages/modify/${data.id}/`, { is_task: data.isTask })
        return res.data
    } catch {
        throw new Error('markMessageAsTask failed')
    }
}

/**
 * EVENTS QUERIES
 */
export const useGetEvents = (params: { startISO: string, endISO: string }, calendarType: 'sidebar' | 'banner') => {
    return useQuery<TEvent[]>(['events', calendarType], () => getEvents(params))
}
const getEvents = async (params: { startISO: string, endISO: string }) => {
    try {
        const res = await apiClient.get('/events/', { params: { datetime_start: params.startISO, datetime_end: params.endISO } })
        return res.data
    } catch {
        throw new Error('getEvents failed')
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

/**
 * SETTINGS QUERIES
 */
export const useGetLinkedAccounts = () => {
    return useQuery<TLinkedAccount[]>('linked_accounts', getLinkedAccounts)
}
const getLinkedAccounts = async () => {
    try {
        const res = await apiClient.get('/linked_accounts/')
        return res.data
    } catch {
        throw new Error('getLinkedAccounts failed')
    }
}


export const useGetSupportedTypes = () => {
    return useQuery<TSupportedType[]>([], getSupportedTypes)
}
const getSupportedTypes = async () => {
    try {
        const res = await apiClient.get('/linked_accounts/supported_types/')
        return res.data
    } catch {
        throw new Error('getSupportedTypes failed')
    }
}


export const useDeleteLinkedAccount = () => {
    const queryClient = useQueryClient()
    return useMutation(deleteLinkedAccount,
        {
            onSettled: () => {
                queryClient.invalidateQueries('linked_accounts')
            }
        }
    )
}
const deleteLinkedAccount = async (data: { id: string }) => {
    try {
        const res = await apiClient.delete(`/linked_accounts/${data.id}/`)
        return res.data
    } catch {
        throw new Error('deleteLinkedAccount failed')
    }
}

/**
 * FEEDBACK QUERIES
 */
export const usePostFeedback = () => {
    return useMutation(postFeedback)
}
const postFeedback = async (data: { feedback: string }) => {
    try {
        const res = await apiClient.post('/feedback/', data)
        return res.data
    } catch {
        throw new Error('postFeedback failed')
    }
}

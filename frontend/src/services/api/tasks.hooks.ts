import produce, { castImmutable } from "immer"
import { useMutation, useQuery } from "react-query"
import { v4 as uuidv4 } from 'uuid'
import apiClient from "../../utils/api"
import { useGTQueryClient } from "../queryUtils"
import { arrayMoveInPlace, getTaskFromSections, getTaskIndexFromSections, resetOrderingIds } from "../../utils/utils"
import { TASK_MARK_AS_DONE_TIMEOUT } from "../../constants"
import { TTaskSection, TEmailThread, TTask, TRecipients } from "../../utils/types"

interface TCreateTaskData {
    title: string
    body: string
    id_task_section: string
}

interface TCreateTaskResponse {
    task_id: string
}

interface TCreateTaskFromThreadData {
    thread_id: string
    title: string
    body: string
    email_id?: string
}

interface TModifyTaskData {
    id: string
    title?: string
    dueDate?: string
    timeAllocated?: number
    body?: string
}

interface TTaskModifyRequestBody {
    id_task_section?: string
    id_ordering?: number
    title?: string
    due_date?: string
    time_duration?: number
    body?: string
}

interface TMarkTaskDoneData {
    taskId: string
    isCompleted: boolean
}

interface TReorderTaskData {
    taskId: string
    dropSectionId: string
    orderingId: number
    dragSectionId?: string
}

export const useGetTasks = () => {
    return useQuery<TTaskSection[], void>('tasks', getTasks)
}
const getTasks = async () => {
    try {
        const res = await apiClient.get('/tasks/v3/')
        return castImmutable(res.data)
    } catch {
        throw new Error('getTasks failed')
    }
}

export const useGetTaskDetail = (data: { taskId: string }) => {
    return useQuery<TEmailThread>(['task', data.taskId], () => getTaskDetail(data))
}
const getTaskDetail = async (data: { taskId: string }) => {
    try {
        const res = await apiClient.get(`/tasks/detail/${data.taskId}`)
        return castImmutable(res.data)
    } catch {
        throw new Error('getTaskDetail failed')
    }
}

export const useFetchExternalTasks = () => {
    const queryClient = useGTQueryClient()
    return useQuery('tasksExternal', fetchExternalTasks, {
        onSettled: () => {
            queryClient.invalidateQueries('tasks')
        },
    })
}
const fetchExternalTasks = async () => {
    try {
        const res = await apiClient.get('/tasks/fetch/')
        return castImmutable(res.data)
    } catch {
        throw new Error('fetchTasks failed')
    }
}

export const useCreateTask = () => {
    const queryClient = useGTQueryClient()
    const optimisticId = uuidv4()
    return useMutation((data: TCreateTaskData) => createTask(data), {
        onMutate: async (data: TCreateTaskData) => {
            // cancel all current getTasks queries
            await queryClient.cancelQueries('tasks')

            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            if (!sections) return

            const newSections = produce(sections, (draft) => {
                const section = draft.find((section) => section.id === data.id_task_section)
                if (!section) return
                const newTask: TTask = {
                    id: optimisticId,
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
                    recipients: { to: [], cc: [], bcc: [] },
                    isOptimistic: true,
                }
                section.tasks = [newTask, ...section.tasks]
            })

            queryClient.setQueryData('tasks', newSections)
        },
        onSuccess: async (response: TCreateTaskResponse, createData: TCreateTaskData) => {
            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            if (!sections) return
            const newSections = produce(sections, (draft) => {
                const task = getTaskFromSections(draft, optimisticId, createData.id_task_section)
                if (!task) return

                task.id = response.task_id
                task.isOptimistic = false
            })
            queryClient.setQueryData('tasks', newSections)
        },
        onSettled: () => {
            queryClient.invalidateQueries('tasks')
        },
    })
}
const createTask = async (data: TCreateTaskData) => {
    try {
        const res = await apiClient.post('/tasks/create/gt_task/', data)
        return castImmutable(res.data)
    } catch {
        throw new Error('createTask failed')
    }
}

/**
 * Creates a task with a reference link back to the email thread
 */
export const useCreateTaskFromThread = () => {
    const queryClient = useGTQueryClient()
    const optimisticId = uuidv4()

    return useMutation((data: TCreateTaskFromThreadData) => createTaskFromThread(data), {
        onMutate: async (data: TCreateTaskFromThreadData) => {
            queryClient.cancelQueries('tasks')
            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            if (!sections) return

            const newSections = produce(sections, (draft) => {
                draft[0].tasks = [
                    {
                        id: optimisticId,
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
                        recipients: {} as TRecipients,
                        linked_email_thread: {
                            linked_thread_id: data.thread_id,
                            email_thread: {
                                id: '0',
                                deeplink: '',
                                is_archived: false,
                                source: {
                                    account_id: '0',
                                    name: 'Gmail',
                                    logo: '',
                                    logo_v2: 'gmail',
                                    is_completable: false,
                                    is_replyable: true,
                                },
                                emails: []
                            }
                        },
                        comments: [],
                    },
                    ...draft[0].tasks
                ]
            })

            queryClient.setQueryData('tasks', newSections)
        },
        onSettled: () => {
            queryClient.invalidateQueries('tasks')
        },
    })
}

const createTaskFromThread = async (data: TCreateTaskFromThreadData) => {
    try {
        const res = await apiClient.post(`/create_task_from_thread/${data.thread_id}/`, {
            title: data.title,
            body: data.body,
            email_id: data.email_id,
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('createTaskFromThread failed')
    }
}

export const useModifyTask = () => {
    const queryClient = useGTQueryClient()
    return useMutation(
        (data: TModifyTaskData) =>
            modifyTask(data),
        {
            onMutate: async (data: TModifyTaskData) => {
                // cancel all current getTasks queries
                await queryClient.cancelQueries('tasks')

                const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
                if (!sections) return

                const newSections = produce(sections, (draft) => {
                    const task = getTaskFromSections(draft, data.id)
                    if (!task) return
                    task.title = data.title || task.title
                    task.due_date = data.dueDate || task.due_date
                    task.time_allocated = data.timeAllocated || task.time_allocated
                    task.body = data.body || task.body
                })

                queryClient.setQueryData('tasks', newSections)
            },
            onSettled: () => {
                queryClient.invalidateQueries('tasks')
            },
        }
    )
}
const modifyTask = async (data: TModifyTaskData) => {
    const requestBody: TTaskModifyRequestBody = {}
    if (data.title !== undefined) requestBody.title = data.title
    if (data.dueDate !== undefined) requestBody.due_date = data.dueDate
    if (data.timeAllocated !== undefined) requestBody.time_duration = data.timeAllocated / 1000000
    if (data.body !== undefined) requestBody.body = data.body
    try {
        const res = await apiClient.patch(`/tasks/modify/${data.id}/`, requestBody)
        return castImmutable(res.data)
    } catch {
        throw new Error('modifyTask failed')
    }
}

export const useMarkTaskDone = () => {
    const queryClient = useGTQueryClient()
    return useMutation((data: TMarkTaskDoneData) => markTaskDone(data), {
        onMutate: async (data: TMarkTaskDoneData) => {
            // cancel all current getTasks queries
            await queryClient.cancelQueries('tasks')

            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            if (!sections) return

            const newSections = produce(sections, (draft) => {
                const task = getTaskFromSections(draft, data.taskId)
                if (task) task.is_done = data.isCompleted
            })

            queryClient.setQueryData('tasks', newSections)

            if (data.isCompleted) {
                setTimeout(() => {
                    const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
                    if (!sections) return

                    const newSections = produce(sections, (draft) => {
                        const { taskIndex, sectionIndex } = getTaskIndexFromSections(draft, data.taskId)
                        if (taskIndex === undefined || sectionIndex === undefined) return
                        draft[sectionIndex].tasks.splice(taskIndex, 1)
                        queryClient.invalidateQueries('tasks')
                    })

                    queryClient.setQueryData('tasks', newSections)
                }, TASK_MARK_AS_DONE_TIMEOUT * 1000)
            }
        },
    })
}
const markTaskDone = async (data: TMarkTaskDoneData) => {
    try {
        const res = await apiClient.patch(`/tasks/modify/${data.taskId}/`, { is_completed: data.isCompleted })
        return castImmutable(res.data)
    } catch {
        throw new Error('markTaskDone failed')
    }
}

export const useReorderTask = () => {
    const queryClient = useGTQueryClient()
    return useMutation(
        (data: TReorderTaskData) =>
            reorderTask(data),
        {
            onMutate: async (data: TReorderTaskData) => {
                // cancel all current getTasks queries
                await queryClient.cancelQueries('tasks')

                const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
                if (!sections) return

                const newSections = produce(sections, (draft) => {
                    // move within the existing section
                    if (!data.dragSectionId || data.dragSectionId === data.dropSectionId) {
                        const section = draft.find((s) => s.id === data.dropSectionId)
                        if (section == null) return
                        const startIndex = section.tasks.findIndex((t) => t.id === data.taskId)
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
                        const dragSection = draft.find((section) => section.id === data.dragSectionId)
                        if (dragSection == null) return
                        const dragTaskIndex = dragSection.tasks.findIndex((task) => task.id === data.taskId)
                        if (dragTaskIndex === -1) return
                        const dragTask = dragSection.tasks[dragTaskIndex]
                        dragSection.tasks.splice(dragTaskIndex, 1)

                        // add task to new location
                        const dropSection = draft.find((section) => section.id === data.dropSectionId)
                        if (dropSection == null) return
                        dropSection.tasks.splice(data.orderingId - 1, 0, dragTask)

                        // update ordering ids
                        resetOrderingIds(dropSection.tasks)
                        resetOrderingIds(dragSection.tasks)
                    }
                })
                queryClient.setQueryData('tasks', newSections)
            },
            onSettled: () => {
                queryClient.invalidateQueries('tasks')
            },
        }
    )
}
const reorderTask = async (data: TReorderTaskData) => {
    try {
        const res = await apiClient.patch(`/tasks/modify/${data.taskId}/`, {
            id_task_section: data.dropSectionId,
            id_ordering: data.orderingId,
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('reorderTask failed')
    }
}

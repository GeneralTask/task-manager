import { DEFAULT_MESSAGE_ID, DEFAULT_SENDER, DEFAULT_SUBJECT } from '../constants/emailConstants'
import { MESSAGES_PER_PAGE, TASK_MARK_AS_DONE_TIMEOUT, TASK_SECTION_DEFAULT_ID } from '../constants'
import {
    TAddTaskSectionData,
    TComposeMessageData,
    TCreateEventPayload,
    TCreateTaskData,
    TCreateTaskResponse,
    TCreateTaskFromThreadData,
    TEmailThreadResponse,
    TMarkMessageReadData,
    TMarkTaskDoneData,
    TModifyTaskData,
    TModifyTaskSectionData,
    TModifyThreadData,
    TPostFeedbackData,
    TReorderTaskData,
    TTaskModifyRequestBody,
    TThreadQueryData,
} from './query-payload-types'
import {
    TEmail,
    TEmailThread,
    TEvent,
    TLinkedAccount,
    TMeetingBanner,
    TMessage,
    TRecipients,
    TSupportedType,
    TTask,
    TTaskSection,
    TUserInfo,
} from '../utils/types'
import { arrayMoveInPlace, resetOrderingIds } from '../utils/utils'
import { useInfiniteQuery, useMutation, useQuery } from 'react-query'

import { DateTime } from 'luxon'
import apiClient from '../utils/api'
import { getTaskFromSections } from '../utils/utils'
import { getMonthsAroundDate } from '../utils/time'
import { v4 as uuidv4 } from 'uuid'
import produce, { castImmutable } from 'immer'
import { useGTQueryClient } from './queryUtils'

/**
 * TASKS QUERIES
 */
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

            const newSections = produce(sections, draft => {
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

            const newSections = produce(sections, draft => {
                const task = getTaskFromSections(draft, data.taskId, data.sectionId)
                if (task) task.is_done = data.isCompleted
            })

            queryClient.setQueryData('tasks', newSections)

            if (data.isCompleted) {
                setTimeout(() => {
                    const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
                    if (!sections) return

                    const newSections = produce(sections, draft => {
                        const task = getTaskFromSections(draft, data.taskId, data.sectionId)
                        if (task) task.is_done = data.isCompleted
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

                const newSections = produce(sections, draft => {
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

/**
 * TASK SECTION QUERIES
 */

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
                tasks: [],
            }
            const newSections = produce(sections, draft => {
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

            const newSections = produce(sections, draft => {
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

            const newSections = produce(sections, draft => {
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
/**
 * THREADS QUERIES
 */
export const useGetInfiniteThreads = (data: { isArchived: boolean }) => {
    return useInfiniteQuery<TEmailThread[]>(['emailThreads', { isArchived: data.isArchived }], ({ pageParam = 1 }) => getInfiniteThreads(pageParam, data.isArchived), {
        getNextPageParam: (_, pages) => pages.length + 1,
    })
}
const getInfiniteThreads = async (pageParam: number, isArchived: boolean) => {
    try {
        const res = await apiClient.get(`/threads/?page=${pageParam}&limit=${MESSAGES_PER_PAGE}&is_archived=${isArchived}`)
        return castImmutable(res.data)
    } catch {
        throw new Error('getInfiniteThreads failed')
    }
}

export const useGetThreadDetail = (data: { threadId: string }) => {
    return useQuery<TEmailThread>(['emailThreads', data.threadId], () => getThreadDetail(data))
}
const getThreadDetail = async (data: { threadId: string }) => {
    try {
        const res = await apiClient.get(`/threads/detail/${data.threadId}`)
        return castImmutable(res.data)
    } catch {
        throw new Error('getThreadDetail failed')
    }
}

export const useModifyThread = () => {
    const queryClient = useGTQueryClient()
    return useMutation((data: TModifyThreadData) => modifyThread(data), {
        onMutate: async (data: TModifyThreadData) => {
            await queryClient.cancelQueries('emailThreads')
            const queryDataInbox = queryClient.getImmutableQueryData<TThreadQueryData>(['emailThreads', { isArchived: false }])
            const queryDataArchive = queryClient.getImmutableQueryData<TThreadQueryData>(['emailThreads', { isArchived: true }])

            if (!queryDataInbox || !queryDataArchive) return

            const [newQueryDataInbox, newQueryDataArchive] = produce([queryDataInbox, queryDataArchive], (draft) => {
                const [pageInbox, pageArchive] = draft
                for (const page of [...pageInbox.pages, ...pageArchive.pages]) {
                    if (!page) continue
                    for (const thread of page) {
                        if (thread.id === data.thread_id) {
                            if (data.is_archived !== undefined)
                                thread.is_archived = data.is_archived
                            for (const email of thread.emails) {
                                if (data.is_unread !== undefined)
                                    email.is_unread = data.is_unread
                            }
                            break
                        }
                    }
                }
            })

            queryClient.setQueryData(['emailThreads', { isArchived: false }], newQueryDataInbox)
            queryClient.setQueryData(['emailThreads', { isArchived: true }], newQueryDataArchive)
        },
        onSettled: () => {
            queryClient.invalidateQueries(['emailThreads'])
        },
    })
}


const modifyThread = async (data: TModifyThreadData) => {
    try {
        const res = await apiClient.patch(`/threads/modify/${data.thread_id}/`, data)
        return castImmutable(res.data)
    } catch {
        throw new Error('modifyThread failed')
    }
}


/**
 * MESSAGES QUERIES
 */
export const useGetInfiniteMessages = () => {
    return useInfiniteQuery<TMessage[], void>('messages', getInfiniteMessages, {
        getNextPageParam: (_, pages) => pages.length + 1,
    })
}
const getInfiniteMessages = async ({ pageParam = 1 }) => {
    try {
        const res = await apiClient.get(`/messages/v2/?page=${pageParam}&limit=${MESSAGES_PER_PAGE}`)
        return castImmutable(res.data)
    } catch {
        throw new Error('getInfiniteMessages failed')
    }
}

export const useFetchMessages = () => {
    const queryClient = useGTQueryClient()
    return useQuery([], () => fetchMessages(), {
        onSettled: () => {
            queryClient.invalidateQueries('emailThreads')
        },
    })
}
const fetchMessages = async () => {
    try {
        const res = await apiClient.get('/messages/fetch/')
        return castImmutable(res.data)
    } catch {
        throw new Error('fetchMessages failed')
    }
}

export const useMeetingBanner = () => {
    return useQuery<TMeetingBanner>('meeting_banner', () => meetingBanner())
}
const meetingBanner = async () => {
    try {
        const res = await apiClient.get('/meeting_banner/')
        return castImmutable(res.data)
    } catch {
        throw new Error('useMeetingBanner failed')
    }
}

export const useMarkMessageRead = () => {
    const queryClient = useGTQueryClient()
    return useMutation((data: TMarkMessageReadData) => markMessageRead(data), {
        onSettled: (_, error, variables) => {
            if (error) return
            queryClient.invalidateQueries(['messages', variables.id])
        },
    })
}
const markMessageRead = async (data: TMarkMessageReadData) => {
    try {
        const res = await apiClient.patch(`/messages/modify/${data.id}/`, { is_read: data.isRead })
        return castImmutable(res.data)
    } catch {
        throw new Error('markMessageRead failed')
    }
}

export const useComposeMessage = () => {
    const queryClient = useGTQueryClient()
    return useMutation((data: TComposeMessageData) => composeMessage(data), {
        onMutate: async (data: TComposeMessageData) => {
            // if message is part of a thread
            if (!data.message_id) return

            await queryClient.cancelQueries('emailThreads')

            const response = queryClient.getImmutableQueryData<TEmailThreadResponse>('emailThreads')
            if (!response) return

            const tempEmail: TEmail = {
                message_id: DEFAULT_MESSAGE_ID,
                subject: data.subject || DEFAULT_SUBJECT,
                body: data.body,
                sent_at: new Date().toISOString(),
                is_unread: false,
                sender: {
                    name: DEFAULT_SENDER,
                    email: data.source_account_id,
                    reply_to: '',
                },
                recipients: data.recipients,
                num_attachments: 0
            }

            const newResponse = produce(response, draft => {
                const thread = draft.pages.flat().find(
                    thread => thread.emails.find(
                        email => email.message_id === data.message_id
                    ) !== null
                )
                if (!thread) return

                thread.emails.push(tempEmail)
            })


            queryClient.setQueryData('emailThreads', newResponse)
        },
        onSettled: async () => {
            await fetchMessages()
            queryClient.invalidateQueries('emailThreads')
        }
    })
}
const composeMessage = async (data: TComposeMessageData) => {
    try {
        const res = await apiClient.post(`/messages/compose/`, data)
        return castImmutable(res.data)
    } catch {
        throw new Error('composeMessage failed')
    }
}

/**
 * EVENTS QUERIES
 */
export const useGetEvents = (params: { startISO: string; endISO: string }, calendarType: 'calendar' | 'banner') => {
    return useQuery<TEvent[]>(['events', calendarType, params.startISO], () => getEvents(params))
}
const getEvents = async (params: { startISO: string; endISO: string }) => {
    try {
        const res = await apiClient.get('/events/', {
            params: { datetime_start: params.startISO, datetime_end: params.endISO },
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('getEvents failed')
    }
}

interface CreateEventParams {
    createEventPayload: TCreateEventPayload
    date: DateTime
}
export const useCreateEvent = () => {
    const queryClient = useGTQueryClient()
    return useMutation(({ createEventPayload }: CreateEventParams) => createEvent(createEventPayload),
        {
            onMutate: async ({ createEventPayload, date }: CreateEventParams) => {
                await queryClient.cancelQueries('events')

                const start = DateTime.fromISO(createEventPayload.datetime_start)
                const end = DateTime.fromISO(createEventPayload.datetime_end)
                const timeBlocks = getMonthsAroundDate(date, 1)
                const blockIndex = timeBlocks.findIndex(block => start >= block.start && end <= block.end)
                const block = timeBlocks[blockIndex]

                const events = queryClient.getImmutableQueryData<TEvent[]>([
                    'events',
                    'calendar',
                    block.start.toISO(),
                ])

                if (events == null) return

                const newEvent: TEvent = {
                    id: uuidv4(),
                    title: createEventPayload.summary ?? '',
                    body: createEventPayload.description ?? '',
                    deeplink: '',
                    datetime_start: createEventPayload.datetime_start,
                    datetime_end: createEventPayload.datetime_end,
                    conference_call: null,
                }

                const newEvents = produce(events, (draft) => {
                    draft.push(newEvent)
                })
                queryClient.setQueryData([
                    'events',
                    'calendar',
                    block.start.toISO(),
                ], newEvents)
            },
            onSettled: () => {
                queryClient.invalidateQueries('events')
            }
        }
    )
}
const createEvent = async (data: TCreateEventPayload) => {
    try {
        const res = await apiClient.post('/events/create/gcal/', data)
        return castImmutable(res.data)
    } catch {
        throw new Error('createEvent failed')
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
        return castImmutable(res.data)
    } catch {
        throw new Error('getUserInfo failed')
    }
}

export const mutateUserInfo = async (userInfo: TUserInfo) => {
    try {
        const res = await apiClient.patch('/user_info/', JSON.stringify(userInfo))
        return castImmutable(res.data)
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
        return castImmutable(res.data)
    } catch {
        throw new Error('getLinkedAccounts failed')
    }
}

export const useGetSupportedTypes = () => {
    return useQuery<TSupportedType[]>('supported_types', getSupportedTypes)
}
const getSupportedTypes = async () => {
    try {
        const res = await apiClient.get('/linked_accounts/supported_types/')
        return castImmutable(res.data)
    } catch {
        throw new Error('getSupportedTypes failed')
    }
}

export const useDeleteLinkedAccount = () => {
    const queryClient = useGTQueryClient()
    return useMutation(deleteLinkedAccount, {
        onSettled: () => {
            queryClient.invalidateQueries('linked_accounts')
        },
    })
}
const deleteLinkedAccount = async (data: { id: string }) => {
    try {
        const res = await apiClient.delete(`/linked_accounts/${data.id}/`)
        return castImmutable(res.data)
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
const postFeedback = async (data: TPostFeedbackData) => {
    try {
        const res = await apiClient.post('/feedback/', data)
        return castImmutable(res.data)
    } catch {
        throw new Error('postFeedback failed')
    }
}

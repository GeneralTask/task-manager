import { QueryFunctionContext, QueryKey, useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import produce, { castImmutable } from 'immer'
import { DateTime } from 'luxon'
import { DONE_FOLDER_ID, TASK_MARK_AS_DONE_TIMEOUT, TRASH_FOLDER_ID } from '../../constants'
import useOverviewContext from '../../context/OverviewContextProvider'
import useQueryContext from '../../context/QueryContext'
import { useGTLocalStorage, useNavigateToTask } from '../../hooks'
import apiClient from '../../utils/api'
import navigateToNextItemAfterOverviewCompletion from '../../utils/navigateToNextItemAfterOverviewCompletion'
import { TExternalStatus, TOverviewView, TTaskFolder, TTaskV4, TUserInfo } from '../../utils/types'
import { resetOrderingIds, sleep } from '../../utils/utils'
import { GTQueryClient, getBackgroundQueryOptions, useGTMutation, useGTQueryClient } from '../queryUtils'

export interface TCreateTaskData {
    title: string
    body?: string
    id_folder?: string
    id_parent?: string
    optimisticId: string
}

export interface TCreateTaskResponse {
    task_id: string
}

export interface TModifyTaskData {
    id: string
    title?: string
    dueDate?: string
    body?: string
    external_priority_id?: string
    priorityNormalized?: number
    status?: TExternalStatus
    recurringTaskTemplateId?: string
}

interface TExternalPriority {
    external_id: string
}
interface TTaskModifyRequestBody {
    task: {
        external_priority?: TExternalPriority
        priority_normalized?: number
        status?: TExternalStatus
        recurring_task_template_id?: string
    }
    id_task_section?: string
    id_ordering?: number
    title?: string
    due_date?: string
    time_duration?: number
    body?: string
}

export interface TMarkTaskDoneOrDeletedData {
    id: string
    isDone?: boolean
    isDeleted?: boolean
    waitForAnimation?: boolean
}

interface TMarkTaskDoneOrDeletedRequestBody {
    is_completed?: boolean
    is_deleted?: boolean
}

export interface TReorderTaskData {
    id: string
    isSubtask?: boolean
    parentId?: string
    dropSectionId: string
    orderingId: number
    dragSectionId?: string
    isJiraTask?: boolean
}
interface TReorderTaskRequestBody {
    id_task_section: string
    id_ordering: number
    is_completed?: boolean
    is_deleted?: boolean
}
export interface TPostCommentData {
    id: string
    body: string
    optimisticId: string
}

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

export const useFetchExternalTasks = () => {
    const queryClient = useGTQueryClient()
    return useQuery('tasksExternal', fetchExternalTasks, {
        onSettled: () => {
            queryClient.invalidateQueries('tasks_v4')
            queryClient.invalidateQueries('folders')
            queryClient.invalidateQueries('overview')
        },
        ...getBackgroundQueryOptions(),
    })
}
const fetchExternalTasks = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/tasks/fetch/', { signal })
        return castImmutable(res.data)
    } catch {
        throw new Error('fetchExternalTasks failed')
    }
}

export const useCreateTask = () => {
    const queryClient = useGTQueryClient()
    const { setOptimisticId } = useQueryContext()
    const navigateToTask = useNavigateToTask()

    return useGTMutation((data: TCreateTaskData) => createTask(data), {
        tag: 'tasks_v4',
        invalidateTagsOnSettled: ['tasks_v4', 'folders', 'overview'],
        onMutate: async (data: TCreateTaskData) => {
            await Promise.all([
                queryClient.cancelQueries('tasks_v4'),
                queryClient.cancelQueries('folders'),
                queryClient.cancelQueries('overview'),
            ])
            const tasks_v4 = queryClient.getImmutableQueryData<TTaskV4[]>('tasks_v4')
            if (tasks_v4) {
                const updatedTasks = produce(tasks_v4, (draft) => {
                    const newTask = createNewTaskV4Helper(data)
                    draft.unshift(newTask)
                    if (data.id_parent) {
                        const parentTask = draft.find((task) => task.id === data.id_parent)
                        if (!parentTask) return
                        parentTask.subtask_ids = [data.optimisticId, ...(parentTask.subtask_ids || [])]
                    }
                })
                queryClient.setQueryData('tasks_v4', updatedTasks)
            }

            const folders = queryClient.getImmutableQueryData<TTaskFolder[]>('folders')
            if (folders) {
                const updatedFolders = produce(folders, (draft) => {
                    const folder = draft.find((folder) => folder.id === data.id_folder)
                    if (!folder) return
                    folder.task_ids.unshift(data.optimisticId)
                })
                queryClient.setQueryData('folders', updatedFolders)
            }

            const lists = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
            if (lists) {
                const updatedLists = produce(lists, (draft) => {
                    const list = draft.find((view) => view.task_section_id === data.id_folder)
                    if (!list) return
                    list.view_item_ids.unshift(data.optimisticId)
                })
                queryClient.setQueryData('overview', updatedLists)
            }
        },
        onSuccess: async (response: TCreateTaskResponse, createData: TCreateTaskData) => {
            setOptimisticId(createData.optimisticId, response.task_id)

            const tasks = queryClient.getImmutableQueryData<TTaskV4[]>('tasks_v4')
            const updatedTasks = produce(tasks, (draft) => {
                const task = draft?.find((task) => task.id === createData.optimisticId)
                if (!task) return
                task.id = response.task_id
                task.optimisticId = undefined
            })
            if (updatedTasks) queryClient.setQueryData('tasks_v4', updatedTasks)

            const folders = queryClient.getImmutableQueryData<TTaskFolder[]>('folders')
            const updatedFolders = produce(folders, (draft) => {
                const folder = draft?.find((folder) => folder.id === createData.id_folder)
                if (!folder) return
                const taskIdIndex = folder.task_ids.indexOf(createData.optimisticId)
                if (taskIdIndex === -1) return
                folder.task_ids[taskIdIndex] = response.task_id
            })
            if (updatedFolders) queryClient.setQueryData('folders', updatedFolders)

            const lists = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
            const updatedLists = produce(lists, (draft) => {
                const list = draft?.find((view) => view.task_section_id === createData.id_folder)
                if (!list) return
                const taskIdIndex = list.view_item_ids.indexOf(createData.optimisticId)
                if (taskIdIndex === -1) return
                list.view_item_ids[taskIdIndex] = response.task_id
            })
            if (lists) queryClient.setQueryData('overview', updatedLists)

            if (window.location.pathname.includes(createData.optimisticId)) {
                navigateToTask({
                    taskId: response.task_id,
                    tasks: updatedTasks as TTaskV4[],
                    folders: updatedFolders as TTaskFolder[],
                    views: updatedLists as TOverviewView[],
                })
            }
        },
    })
}
export const createTask = async (data: TCreateTaskData) => {
    try {
        const res = await apiClient.post('/tasks/create/gt_task/', {
            title: data.title,
            body: data.body ?? '',
            id_task_section: data.id_folder,
            parent_task_id: data.id_parent,
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('createTask failed')
    }
}

const COMPLETED_TASK_TYPES = ['completed', 'canceled', 'done']

const optimisticallyUpdateTask = async (queryClient: GTQueryClient, data: TModifyTaskData, queryKey: QueryKey) => {
    const queryData = queryClient.getImmutableQueryData<TTaskV4[]>(queryKey)
    if (!queryData) return

    const updatedTasks = produce(queryData, (draft) => {
        const task = draft.find((task) => task.id === data.id)
        if (!task) return
        task.title = data.title || task.title
        if (data.dueDate === '1969-12-31') {
            task.due_date = ''
        } else {
            task.due_date = data.dueDate ?? task.due_date
        }
        task.body = data.body ?? task.body
        task.priority_normalized = data.priorityNormalized ?? task.priority_normalized
        task.external_status = data.status ?? task.external_status
        task.is_done = COMPLETED_TASK_TYPES.includes(data.status?.type ?? '') ?? task.is_done
        task.recurring_task_template_id = data.recurringTaskTemplateId ?? task.recurring_task_template_id
        if (data.external_priority_id) {
            const newPriority = task.all_priorities?.find(
                (priority) => priority.external_id === data.external_priority_id
            )
            if (newPriority) task.priority = newPriority
        }
        task.updated_at = DateTime.utc().toISO()
    })
    queryClient.setQueryData(queryKey, updatedTasks)
}

export const useModifyTask = (useQueueing = true) => {
    const queryClient = useGTQueryClient()
    return useGTMutation(
        (data: TModifyTaskData) => modifyTask(data),
        {
            tag: 'tasks_v4',
            invalidateTagsOnSettled: ['tasks_v4', 'overview', 'folders', 'meeting_preparation_tasks'],
            onMutate: async (data: TModifyTaskData) => {
                await Promise.all([
                    queryClient.cancelQueries('overview'),
                    queryClient.cancelQueries('folders'),
                    queryClient.cancelQueries('tasks_v4'),
                    queryClient.cancelQueries('meeting_preparation_tasks'),
                ])
                optimisticallyUpdateTask(queryClient, data, 'tasks_v4')
                optimisticallyUpdateTask(queryClient, data, 'meeting_preparation_tasks')

                if (!COMPLETED_TASK_TYPES.includes(data.status?.type ?? '')) return
                const folders = queryClient.getImmutableQueryData<TTaskFolder[]>('folders')
                if (!folders) return
                const updatedFolders = produce(folders, (draft) => {
                    const currentFolder = draft.find((folder) => folder.task_ids.includes(data.id))
                    const doneFolder = draft.find((folder) => folder.id === DONE_FOLDER_ID)
                    if (!currentFolder || !doneFolder) return
                    currentFolder.task_ids = currentFolder.task_ids.filter((id) => id !== data.id)
                    doneFolder.task_ids.unshift(data.id)
                })
                queryClient.setQueryData('folders', updatedFolders)

                const lists = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
                if (!lists) return
                const updatedLists = produce(lists, (draft) => {
                    const currentLists = draft.filter((list) => list.view_item_ids.includes(data.id))
                    if (!currentLists) return
                    for (const list of currentLists) {
                        list.view_item_ids = list.view_item_ids.filter((id) => id !== data.id)
                    }
                })
                queryClient.setQueryData('overview', updatedLists)
            },
        },
        useQueueing
    )
}
const modifyTask = async (data: TModifyTaskData) => {
    // Format due date to ISO string in format yyyy-MM-dd
    if (data.dueDate) {
        data.dueDate = DateTime.fromISO(data.dueDate).toFormat('yyyy-MM-dd')
    }
    const requestBody: TTaskModifyRequestBody = { task: {} }
    if (data.title !== undefined) requestBody.title = data.title
    if (data.dueDate !== undefined) requestBody.due_date = data.dueDate
    if (data.body !== undefined) requestBody.body = data.body
    if (data.external_priority_id !== undefined) {
        if (!requestBody.task.external_priority)
            requestBody.task.external_priority = {
                external_id: data.external_priority_id,
            }
    }
    if (data.priorityNormalized !== undefined) requestBody.task.priority_normalized = data.priorityNormalized
    if (data.status !== undefined) requestBody.task.status = data.status
    if (data.recurringTaskTemplateId !== undefined)
        requestBody.task.recurring_task_template_id = data.recurringTaskTemplateId
    try {
        const res = await apiClient.patch(`/tasks/modify/${data.id}/`, requestBody)
        return castImmutable(res.data)
    } catch {
        throw new Error('modifyTask failed')
    }
}

export const useMarkTaskDoneOrDeleted = (useQueueing = true) => {
    const queryClient = useGTQueryClient()
    const [overviewAutomaticEmptySort] = useGTLocalStorage('overviewAutomaticEmptySort', false, true)
    const navigate = useNavigate()
    const { setOpenListIds } = useOverviewContext()

    return useGTMutation(
        (data: TMarkTaskDoneOrDeletedData) => markTaskDoneOrDeleted(data),
        {
            tag: 'tasks_v4',
            invalidateTagsOnSettled: ['tasks_v4', 'folders', 'overview'],
            onMutate: async (data: TMarkTaskDoneOrDeletedData) => {
                await Promise.all([
                    queryClient.cancelQueries('tasks_v4'),
                    queryClient.cancelQueries('folders'),
                    queryClient.cancelQueries('overview'),
                    queryClient.cancelQueries('meeting_preparation_tasks'),
                ])
                const meetingTasks = queryClient.getImmutableQueryData<TTaskV4[]>('meeting_preparation_tasks')
                const updateMeetingTasks = async () => {
                    if (!meetingTasks) return
                    const updatedMeetingTasks = produce(meetingTasks, (draft) => {
                        const task = draft.find((task) => task.id === data.id)
                        if (!task) return
                        if (data.isDone !== undefined) task.is_done = data.isDone
                        if (data.isDeleted !== undefined) task.is_deleted = data.isDeleted
                    })
                    if (data.waitForAnimation) {
                        await sleep(TASK_MARK_AS_DONE_TIMEOUT)
                    }
                    queryClient.setQueryData('meeting_preparation_tasks', updatedMeetingTasks)
                }

                const tasks = queryClient.getImmutableQueryData<TTaskV4[]>('tasks_v4')
                const updateTasks = async () => {
                    if (!tasks) return
                    const updatedTasks = produce(tasks, (draft) => {
                        const task = draft.find((task) => task.id === data.id)
                        if (!task) return
                        if (data.isDone !== undefined) task.is_done = data.isDone
                        if (data.isDeleted !== undefined) task.is_deleted = data.isDeleted
                    })
                    if (data.waitForAnimation) {
                        await sleep(TASK_MARK_AS_DONE_TIMEOUT)
                    }
                    queryClient.setQueryData('tasks_v4', updatedTasks)
                }

                const folders = queryClient.getImmutableQueryData<TTaskFolder[]>('folders')
                const updateFolders = async () => {
                    if (!folders) return
                    const updatedFolders = produce(folders, (draft) => {
                        const currentFolder = draft.find((folder) => folder.task_ids.includes(data.id))
                        const doneFolder = draft.find((folder) => folder.id === DONE_FOLDER_ID)
                        const trashFolder = draft.find((folder) => folder.id === TRASH_FOLDER_ID)
                        if (!currentFolder || !doneFolder || !trashFolder) return
                        if (data.isDone !== undefined) {
                            if (data.isDone && !currentFolder.is_done) {
                                currentFolder.task_ids = currentFolder.task_ids.filter((id) => id !== data.id)
                                doneFolder.task_ids.unshift(data.id)
                            } else if (!data.isDone && currentFolder.is_done) {
                                doneFolder.task_ids = doneFolder.task_ids.filter((id) => id !== data.id)
                                currentFolder.task_ids.unshift(data.id)
                            }
                        }
                        if (data.isDeleted !== undefined) {
                            if (data.isDeleted && !currentFolder.is_trash) {
                                currentFolder.task_ids = currentFolder.task_ids.filter((id) => id !== data.id)
                                trashFolder.task_ids.unshift(data.id)
                            } else if (!data.isDeleted && currentFolder.is_trash) {
                                trashFolder.task_ids = trashFolder.task_ids.filter((id) => id !== data.id)
                                currentFolder.task_ids.unshift(data.id)
                            }
                        }
                    })
                    if (data.waitForAnimation) {
                        await sleep(TASK_MARK_AS_DONE_TIMEOUT)
                    }
                    queryClient.setQueryData('folders', updatedFolders)
                }

                const lists = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
                const updateLists = async () => {
                    if (!lists) return
                    const updatedLists = produce(lists, (draft) => {
                        const currentLists = draft.filter((list) => list.view_item_ids.includes(data.id))
                        if (!currentLists) return
                        if (data.isDone || data.isDeleted) {
                            for (const list of currentLists) {
                                list.view_item_ids = list.view_item_ids.filter((id) => id !== data.id)
                                if (list.view_item_ids.length === 0) {
                                    list.has_tasks_completed_today = true
                                }
                            }
                        }
                        if (overviewAutomaticEmptySort) {
                            draft.sort((a, b) => {
                                if (a.view_item_ids.length === 0 && b.view_item_ids.length > 0) return 1
                                if (a.view_item_ids.length > 0 && b.view_item_ids.length === 0) return -1
                                return 0
                            })
                        }
                    })
                    if (data.waitForAnimation) {
                        await sleep(TASK_MARK_AS_DONE_TIMEOUT)
                    }

                    queryClient.setQueryData('overview', updatedLists)

                    if (window.location.pathname.split('/')[1] !== 'overview') return
                    if (!lists.some((list) => list.view_item_ids.includes(data.id))) return
                    navigateToNextItemAfterOverviewCompletion(
                        lists as TOverviewView[],
                        updatedLists as TOverviewView[],
                        data.id,
                        navigate,
                        setOpenListIds
                    )
                }
                // execute in parallel if waiting for animation delay
                updateFolders()
                updateTasks()
                updateLists()
                updateMeetingTasks()
            },
        },
        useQueueing
    )
}
export const markTaskDoneOrDeleted = async (data: TMarkTaskDoneOrDeletedData) => {
    const requestBody: TMarkTaskDoneOrDeletedRequestBody = {}
    if (data.isDone !== undefined) requestBody.is_completed = data.isDone
    if (data.isDeleted !== undefined) requestBody.is_deleted = data.isDeleted
    try {
        const res = await apiClient.patch(`/tasks/modify/${data.id}/`, requestBody)
        return castImmutable(res.data)
    } catch {
        throw new Error('markTaskDoneOrDeleted failed')
    }
}

export const useReorderTask = (useQueueing = true) => {
    const queryClient = useGTQueryClient()
    return useGTMutation(
        (data: TReorderTaskData) => reorderTask(data),
        {
            tag: 'tasks_v4',
            invalidateTagsOnSettled: ['tasks_v4', 'folders', 'overview'],
            onMutate: async (data: TReorderTaskData) => {
                await Promise.all([
                    queryClient.cancelQueries('tasks_v4'),
                    queryClient.cancelQueries('folders'),
                    queryClient.cancelQueries('overview'),
                ])

                const tasks = queryClient.getImmutableQueryData<TTaskV4[]>('tasks_v4')
                if (tasks) {
                    const updatedTasks = produce(tasks, (draft) => {
                        const task = draft.find((task) => task.id === data.id)
                        if (!task) return
                        if (task.id_parent) {
                            task.id_ordering = data.orderingId
                            const parentSubtasks = draft
                                .filter((task) => task.id_parent === data.parentId)
                                .sort((a, b) => {
                                    if (a.id_ordering === b.id_ordering) return task.id === a.id ? -1 : 1
                                    return a.id_ordering - b.id_ordering
                                })
                            resetOrderingIds(parentSubtasks)
                        } else {
                            task.id_ordering = data.orderingId
                            task.id_folder = data.dropSectionId
                            task.is_done = data.dropSectionId === DONE_FOLDER_ID
                            task.is_deleted = data.dropSectionId === TRASH_FOLDER_ID
                            const dropFolder = draft
                                .filter((task) => task.id_folder === data.dropSectionId)
                                .sort((a, b) => {
                                    if (a.id_ordering === b.id_ordering) return task.id === a.id ? -1 : 1
                                    return a.id_ordering - b.id_ordering
                                })
                            resetOrderingIds(dropFolder)
                        }
                    })
                    queryClient.setQueryData('tasks_v4', updatedTasks)
                }

                if (!data.dragSectionId || data.dropSectionId === data.dragSectionId) return

                const folders = queryClient.getImmutableQueryData<TTaskFolder[]>('folders')
                if (folders) {
                    const updatedFolders = produce(folders, (draft) => {
                        const previousFolder = draft.find((folder) => folder.id === data.dragSectionId)
                        const newFolder = draft.find((folder) => folder.id === data.dropSectionId)
                        if (!previousFolder || !newFolder) return
                        previousFolder.task_ids = previousFolder.task_ids.filter((id) => id !== data.id)
                        newFolder.task_ids.unshift(data.id)
                    })
                    queryClient.setQueryData('folders', updatedFolders)
                }

                const lists = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
                if (lists) {
                    const updatedLists = produce(lists, (draft) => {
                        const previousList = draft.find((list) => list.task_section_id === data.dragSectionId)
                        const newList = draft.find((list) => list.task_section_id === data.dropSectionId)
                        if (!previousList || !newList) return
                        previousList.view_item_ids = previousList.view_item_ids.filter((id) => id !== data.id)
                        newList.view_item_ids.unshift(data.id)
                    })
                    queryClient.setQueryData('overview', updatedLists)
                }
            },
        },
        useQueueing
    )
}

export const reorderTask = async (data: TReorderTaskData) => {
    try {
        const requestBody: TReorderTaskRequestBody = {
            id_task_section: data.dropSectionId,
            id_ordering: data.orderingId,
            is_completed: data.isSubtask ? undefined : data.dropSectionId === DONE_FOLDER_ID,
        }
        if (data.isJiraTask) {
            requestBody.is_deleted = data.dropSectionId === TRASH_FOLDER_ID
        }
        const res = await apiClient.patch(`/tasks/modify/${data.id}/`, requestBody)
        return castImmutable(res.data)
    } catch {
        throw new Error('reorderTask failed')
    }
}

export const usePostComment = () => {
    const queryClient = useGTQueryClient()
    return useGTMutation((data: TPostCommentData) => postComment(data), {
        tag: 'tasks_v4',
        invalidateTagsOnSettled: ['tasks_v4'],
        onMutate: async (data: TPostCommentData) => {
            await queryClient.cancelQueries('tasks_v4')

            const userInfo = queryClient.getImmutableQueryData<TUserInfo>('user_info')

            const tasks = queryClient.getImmutableQueryData<TTaskV4[]>('tasks_v4')
            if (tasks) {
                const updatedTasks = produce(tasks, (draft) => {
                    const task = draft.find((task) => task.id === data.id)
                    if (!task) return
                    task.comments?.unshift({
                        body: data.body,
                        created_at: DateTime.local().toISO(),
                        user: {
                            DisplayName: userInfo?.linear_display_name ?? 'You',
                            Email: '',
                            ExternalID: data.optimisticId,
                            Name: userInfo?.linear_name ?? 'You',
                        },
                    })
                })

                queryClient.setQueryData('tasks_v4', updatedTasks)
            }
        },
    })
}
const postComment = async (data: TPostCommentData) => {
    try {
        const res = await apiClient.post(`/tasks/${data.id}/comments/add/`, data)
        return castImmutable(res.data)
    } catch {
        throw new Error('postComment failed')
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
        },
        sender: data.sender ?? '',
        is_done: data.is_done ?? false,
        is_deleted: data.is_deleted ?? false,
        created_at: data.created_at ?? DateTime.utc().toISO(),
        updated_at: data.updated_at ?? DateTime.utc().toISO(),
        id_folder: data.id_folder ?? undefined,
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

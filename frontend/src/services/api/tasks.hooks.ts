import { QueryFunctionContext, useQuery } from 'react-query'
import produce, { castImmutable } from 'immer'
import { DONE_SECTION_ID, TASK_MARK_AS_DONE_TIMEOUT, TASK_REFETCH_INTERVAL, TRASH_SECTION_ID } from '../../constants'
import apiClient from '../../utils/api'
import { TExternalStatus, TOverviewItem, TOverviewView, TTask, TTaskSection } from '../../utils/types'
import {
    arrayMoveInPlace,
    getTaskFromSections,
    getTaskIndexFromSections,
    resetOrderingIds,
    sleep,
} from '../../utils/utils'
import { GTQueryClient, useGTQueryClient, useQueuedMutation } from '../queryUtils'

export interface TCreateTaskData {
    title: string
    body?: string
    taskSectionId: string
    parent_task_id?: string
    optimisticId: string
}

export interface TCreateTaskResponse {
    task_id: string
}

export interface TModifyTaskData {
    id: string
    title?: string
    dueDate?: string
    timeAllocated?: number
    body?: string
    priorityNormalized?: number
    status?: TExternalStatus
}

interface TTaskModifyRequestBody {
    task: {
        priority_normalized?: number
        status?: TExternalStatus
    }
    id_task_section?: string
    id_ordering?: number
    title?: string
    due_date?: string
    time_duration?: number
    body?: string
}

export interface TMarkTaskDoneOrDeletedData {
    taskId: string
    sectionId?: string
    subtaskId?: string
    isDone?: boolean
    isDeleted?: boolean
    waitForAnimation?: boolean
}

interface TMarkTaskDoneOrDeletedRequestBody {
    is_completed?: boolean
    is_deleted?: boolean
}

export interface TReorderTaskData {
    taskId: string
    dropSectionId: string
    orderingId: number
    dragSectionId?: string
}

export interface TPostCommentData {
    taskId: string
    body: string
}

export const useGetTasks = (isEnabled = true) => {
    return useQuery<TTaskSection[], void>('tasks', getTasks, { enabled: isEnabled, refetchOnMount: false })
}
const getTasks = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/tasks/v3/', { signal })
        return castImmutable(res.data)
    } catch {
        throw new Error('getTasks failed')
    }
}

export const useFetchExternalTasks = () => {
    const queryClient = useGTQueryClient()
    return useQuery('tasksExternal', fetchExternalTasks, {
        onSettled: () => {
            queryClient.invalidateQueries('tasks')
            queryClient.invalidateQueries('overview')
        },
        refetchInterval: TASK_REFETCH_INTERVAL,
        refetchIntervalInBackground: true,
    })
}
const fetchExternalTasks = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/tasks/fetch/', { signal })
        return castImmutable(res.data)
    } catch {
        throw new Error('fetchTasks failed')
    }
}

const updateCacheForOptimsticSubtask = (queryClient: GTQueryClient, data: TCreateTaskData) => {
    const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
    if (!sections) return
    const updatedSections = produce(sections, (draft) => {
        const section = draft.find((section) => section.id === data.taskSectionId)
        if (!section) return
        const parentTask = section.tasks.find((task) => task.id === data.parent_task_id)
        const newSubtask: TTask = {
            id: data.optimisticId,
            id_ordering: 0.5,
            title: data.title,
            body: data.body ?? '',
            deeplink: '',
            sent_at: '',
            priority_normalized: 0,
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
            is_deleted: false,
            isOptimistic: true,
            is_meeting_preparation_task: false,
            nux_number_id: 0,
            created_at: '',
            updated_at: '',
        }
        if (!parentTask) return
        if (!parentTask.sub_tasks) parentTask.sub_tasks = []
        parentTask.sub_tasks.push(newSubtask)
    })
    queryClient.setQueryData('tasks', updatedSections)
}

export const useCreateTask = () => {
    const queryClient = useGTQueryClient()
    return useQueuedMutation((data: TCreateTaskData) => createTask(data), {
        tag: 'tasks',
        invalidateTagsOnSettled: ['tasks', 'overview'],
        onMutate: async (data: TCreateTaskData) => {
            if (data.parent_task_id) {
                updateCacheForOptimsticSubtask(queryClient, data)
                return
            }
            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
            await Promise.all([
                queryClient.cancelQueries('overview-supported-views'),
                queryClient.cancelQueries('overview'),
                queryClient.cancelQueries('tasks'),
            ])

            if (sections) {
                const updatedSections = produce(sections, (draft) => {
                    const section = draft.find((section) => section.id === data.taskSectionId)
                    if (!section) return
                    const newTask: TTask = {
                        id: data.optimisticId,
                        id_ordering: 0.5,
                        title: data.title,
                        body: data.body ?? '',
                        deeplink: '',
                        sent_at: '',
                        priority_normalized: 0,
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
                        is_deleted: false,
                        isOptimistic: true,
                        is_meeting_preparation_task: false,
                        nux_number_id: 0,
                        created_at: '',
                        updated_at: '',
                    }
                    section.tasks = [newTask, ...section.tasks]
                })
                queryClient.setQueryData('tasks', updatedSections)
            }
            if (views) {
                const updatedViews = produce(views, (draft) => {
                    const section = draft.find((view) => view.task_section_id === data.taskSectionId)
                    if (!section) return
                    const newTask = {
                        id: data.optimisticId,
                        id_ordering: 0.5,
                        title: data.title,
                        body: data.body ?? '',
                        deeplink: '',
                        sent_at: '',
                        priority_normalized: 0,
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
                        is_deleted: false,
                        isOptimistic: true,
                        is_meeting_preparation_task: false,
                    } as TOverviewItem
                    section.view_items = [newTask, ...section.view_items]
                })
                queryClient.setQueryData('overview', updatedViews)
            }
        },
        onSuccess: async (response: TCreateTaskResponse, createData: TCreateTaskData) => {
            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')

            if (sections) {
                const updatedSections = produce(sections, (draft) => {
                    const task = getTaskFromSections(draft, createData.optimisticId, createData.taskSectionId)
                    if (!task?.id) return
                    task.id = response.task_id
                    task.isOptimistic = false
                })
                queryClient.setQueryData('tasks', updatedSections)
            }
            if (views) {
                const updatedViews = produce(views, (draft) => {
                    const section = draft.find((section) => section.task_section_id === createData.taskSectionId)
                    const task = section?.view_items.find((task) => task.id === createData.optimisticId)
                    if (!task) return
                    task.id = response.task_id
                    task.isOptimistic = false
                })
                queryClient.setQueryData('overview', updatedViews)
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
        // temporary fix to ensure that tasks are ordered correctly when created
        await apiClient.get('/tasks/v3/')
        return castImmutable(res.data)
    } catch {
        throw new Error('createTask failed')
    }
}

export const useModifyTask = () => {
    const queryClient = useGTQueryClient()
    return useQueuedMutation((data: TModifyTaskData) => modifyTask(data), {
        tag: 'tasks',
        invalidateTagsOnSettled: ['tasks', 'overview'],
        onMutate: async (data: TModifyTaskData) => {
            await Promise.all([
                queryClient.cancelQueries('overview-supported-views'),
                queryClient.cancelQueries('overview'),
                queryClient.cancelQueries('tasks'),
            ])

            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            if (sections) {
                const newSections = produce(sections, (draft) => {
                    const task = getTaskFromSections(draft, data.id)
                    if (!task) return
                    task.title = data.title || task.title
                    task.due_date = data.dueDate || task.due_date
                    task.time_allocated = data.timeAllocated || task.time_allocated
                    task.body = data.body || task.body
                    task.priority_normalized = data.priorityNormalized || task.priority_normalized
                    task.external_status = data.status || task.external_status
                })

                queryClient.setQueryData('tasks', newSections)
            }

            const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
            if (views) {
                const newViews = produce(views, (draft) => {
                    const sections = views.map((view) => ({
                        id: view.task_section_id,
                        tasks: view.view_items,
                    }))
                    const { taskIndex, sectionIndex } = getTaskIndexFromSections(sections, data.id)
                    if (sectionIndex === undefined || taskIndex === undefined) return
                    const task = draft[sectionIndex].view_items[taskIndex]
                    if (!task) return
                    task.title = data.title ?? task.title
                    task.due_date = data.dueDate ?? task.due_date
                    task.time_allocated = data.timeAllocated ?? task.time_allocated
                    task.body = data.body ?? task.body
                    task.priority_normalized = data.priorityNormalized ?? task.priority_normalized
                    task.external_status = data.status ?? task.external_status
                })

                queryClient.setQueryData('overview', newViews)
            }
        },
    })
}
const modifyTask = async (data: TModifyTaskData) => {
    const requestBody: TTaskModifyRequestBody = { task: {} }
    if (data.title !== undefined) requestBody.title = data.title
    if (data.dueDate !== undefined) requestBody.due_date = data.dueDate
    if (data.timeAllocated !== undefined) requestBody.time_duration = data.timeAllocated / 1000000
    if (data.body !== undefined) requestBody.body = data.body
    if (data.priorityNormalized !== undefined) requestBody.task.priority_normalized = data.priorityNormalized
    if (data.status !== undefined) requestBody.task.status = data.status
    try {
        const res = await apiClient.patch(`/tasks/modify/${data.id}/`, requestBody)
        return castImmutable(res.data)
    } catch {
        throw new Error('modifyTask failed')
    }
}

export const useMarkTaskDoneOrDeleted = () => {
    const queryClient = useGTQueryClient()
    return useQueuedMutation((data: TMarkTaskDoneOrDeletedData) => markTaskDoneOrDeleted(data), {
        tag: 'tasks',
        invalidateTagsOnSettled: ['tasks', 'overview'],
        onMutate: async (data: TMarkTaskDoneOrDeletedData) => {
            await Promise.all([queryClient.cancelQueries('tasks'), queryClient.cancelQueries('overview')])
            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            const lists = queryClient.getImmutableQueryData<TOverviewView[]>('overview')

            const updateSections = async () => {
                if (sections) {
                    const newSections = produce(sections, (draft) => {
                        const { taskIndex, sectionIndex, subtaskIndex } = getTaskIndexFromSections(
                            draft,
                            data.taskId,
                            undefined,
                            data.subtaskId
                        )
                        if (taskIndex === undefined || sectionIndex === undefined) return

                        const task = draft[sectionIndex].tasks[taskIndex]
                        if (data.subtaskId !== undefined) {
                            if (subtaskIndex === undefined) return
                            const subtask = task.sub_tasks?.[subtaskIndex]
                            if (!subtask) return
                            if (data.isDone !== undefined) subtask.is_done = data.isDone
                            draft[sectionIndex].tasks[taskIndex].sub_tasks?.splice(subtaskIndex, 1)
                        } else {
                            if (data.isDone !== undefined) task.is_done = data.isDone
                            if (data.isDeleted !== undefined) task.is_deleted = data.isDeleted
                            if (data.isDeleted) draft.find((s) => s.is_trash)?.tasks.unshift(task)
                            if (data.isDone) draft.find((s) => s.is_done)?.tasks.unshift(task)
                            draft[sectionIndex].tasks.splice(taskIndex, 1)
                        }
                    })
                    if (data.waitForAnimation) {
                        await sleep(TASK_MARK_AS_DONE_TIMEOUT)
                    }
                    queryClient.setQueryData('tasks', newSections)
                }
            }
            const updateOverviewPage = async () => {
                if (!lists) return
                const newLists = produce(lists, (draft) => {
                    const sections = lists.map((view) => ({
                        id: view.task_section_id,
                        tasks: view.view_items,
                    }))
                    const { taskIndex, sectionIndex, subtaskIndex } = getTaskIndexFromSections(
                        sections,
                        data.taskId,
                        data.sectionId,
                        data.subtaskId
                    )
                    if (sectionIndex === undefined || taskIndex === undefined) return
                    const task = draft[sectionIndex].view_items[taskIndex]
                    if (data.subtaskId) {
                        if (subtaskIndex === undefined) return
                        if (!task.sub_tasks) return
                        if (data.isDone !== undefined) task.sub_tasks[subtaskIndex].is_done = data.isDone
                        if (data.isDeleted !== undefined) task.sub_tasks[subtaskIndex].is_deleted = data.isDeleted
                        task.sub_tasks.splice(subtaskIndex, 1)
                    } else {
                        if (data.isDone !== undefined) task.is_done = data.isDone
                        if (data.isDeleted !== undefined) task.is_deleted = data.isDeleted
                        draft[sectionIndex].view_items.splice(taskIndex, 1)
                    }
                })
                if (data.waitForAnimation) {
                    await sleep(TASK_MARK_AS_DONE_TIMEOUT)
                }
                queryClient.setQueryData('overview', newLists)
            }
            // execute in parallel if waiting for animation delay
            updateSections()
            updateOverviewPage()
        },
    })
}
export const markTaskDoneOrDeleted = async (data: TMarkTaskDoneOrDeletedData) => {
    const requestBody: TMarkTaskDoneOrDeletedRequestBody = {}
    if (data.isDone !== undefined) requestBody.is_completed = data.isDone
    if (data.isDeleted !== undefined) requestBody.is_deleted = data.isDeleted
    try {
        const updateTaskId = data.subtaskId ?? data.taskId
        const res = await apiClient.patch(`/tasks/modify/${updateTaskId}/`, requestBody)
        return castImmutable(res.data)
    } catch {
        throw new Error('markTaskDone failed')
    }
}

export const useReorderTask = () => {
    const queryClient = useGTQueryClient()
    return useQueuedMutation((data: TReorderTaskData) => reorderTask(data), {
        tag: 'tasks',
        invalidateTagsOnSettled: ['tasks', 'overview'],
        onMutate: async (data: TReorderTaskData) => {
            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
            await Promise.all([
                queryClient.cancelQueries('overview-supported-views'),
                queryClient.cancelQueries('overview'),
                queryClient.cancelQueries('tasks'),
            ])

            if (sections) {
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

                        // change done/trash status if needed
                        dragTask.is_done = data.dropSectionId === DONE_SECTION_ID
                        dragTask.is_deleted = data.dropSectionId === TRASH_SECTION_ID

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
            }
            if (views) {
                const newViews = produce(views, (draft) => {
                    // move within the existing section
                    if (!data.dragSectionId || data.dragSectionId === data.dropSectionId) {
                        const section = draft.find((view) => view.task_section_id === data.dropSectionId)
                        if (section == null) return
                        const startIndex = section.view_items.findIndex((t) => t.id === data.taskId)
                        if (startIndex === -1) return
                        let endIndex = data.orderingId - 1
                        if (startIndex < endIndex) {
                            endIndex -= 1
                        }
                        arrayMoveInPlace(section.view_items, startIndex, endIndex)

                        // update ordering ids
                        resetOrderingIds(section.view_items)
                    }
                    // move task from one section to the other
                    else {
                        // remove task from old location
                        const dragSection = draft.find((section) => section.task_section_id === data.dragSectionId)
                        if (dragSection == null) return
                        const dragTaskIndex = dragSection.view_items.findIndex((item) => item.id === data.taskId)
                        if (dragTaskIndex === -1) return
                        const dragTask = dragSection.view_items[dragTaskIndex]
                        dragSection.view_items.splice(dragTaskIndex, 1)

                        // add task to new location
                        const dropSection = draft.find((section) => section.task_section_id === data.dropSectionId)
                        if (dropSection == null) return
                        dropSection.view_items.splice(data.orderingId - 1, 0, dragTask)

                        // update ordering ids
                        resetOrderingIds(dropSection.view_items)
                        resetOrderingIds(dragSection.view_items)
                    }
                })
                queryClient.setQueryData('overview', newViews)
            }
        },
    })
}
export const reorderTask = async (data: TReorderTaskData) => {
    try {
        const res = await apiClient.patch(`/tasks/modify/${data.taskId}/`, {
            id_task_section: data.dropSectionId,
            id_ordering: data.orderingId,
            is_completed: data.dropSectionId === DONE_SECTION_ID,
            is_deleted: data.dropSectionId === TRASH_SECTION_ID,
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('reorderTask failed')
    }
}

export const usePostComment = () => {
    const queryClient = useGTQueryClient()
    return useQueuedMutation((data: TPostCommentData) => postComment(data), {
        tag: 'tasks',
        invalidateTagsOnSettled: ['tasks', 'overview'],
        onMutate: async (data: TPostCommentData) => {
            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
            await Promise.all([queryClient.cancelQueries('tasks'), queryClient.cancelQueries('overview')])
            if (sections) {
                const newSections = produce(sections, (draft) => {
                    const task = getTaskFromSections(draft, data.taskId)
                    if (task) {
                        task.comments?.unshift({
                            body: data.body,
                            created_at: '0',
                            user: {
                                DisplayName: 'You',
                                Email: '',
                                ExternalID: '0',
                                Name: 'You',
                            },
                        })
                    }
                })

                queryClient.setQueryData('tasks', newSections)
            }
            if (views) {
                const newViews = produce(views, (draft) => {
                    const sections = views.map((view) => ({
                        id: view.task_section_id,
                        tasks: view.view_items,
                    }))
                    const { taskIndex, sectionIndex } = getTaskIndexFromSections(sections, data.taskId)
                    if (sectionIndex !== undefined && taskIndex !== undefined) {
                        const task = draft[sectionIndex].view_items[taskIndex]
                        task.comments?.unshift({
                            body: data.body,
                            created_at: '0',
                            user: {
                                DisplayName: 'You',
                                Email: '',
                                ExternalID: '0',
                                Name: 'You',
                            },
                        })
                    }
                })

                queryClient.setQueryData('overview', newViews)
            }
        },
    })
}
const postComment = async (data: TPostCommentData) => {
    try {
        const res = await apiClient.post(`/tasks/${data.taskId}/comments/add/`, data)
        return castImmutable(res.data)
    } catch {
        throw new Error('postComment failed')
    }
}

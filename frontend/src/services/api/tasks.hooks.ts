import { QueryFunctionContext, useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import produce, { castImmutable } from 'immer'
import { DateTime } from 'luxon'
import { DONE_FOLDER_ID, TASK_MARK_AS_DONE_TIMEOUT, TRASH_FOLDER_ID } from '../../constants'
import useOverviewContext from '../../context/OverviewContextProvider'
import useQueryContext from '../../context/QueryContext'
import { useGTLocalStorage, useNavigateToTask } from '../../hooks'
import apiClient from '../../utils/api'
import navigateToNextItemAfterOverviewCompletion from '../../utils/navigateToNextItemAfterOverviewCompletion'
import { TExternalStatus, TOverviewView, TTaskFolder, TTaskSection, TTaskV4, TUserInfo } from '../../utils/types'
import { arrayMoveInPlace, resetOrderingIds, sleep } from '../../utils/utils'
import { GTQueryClient, getBackgroundQueryOptions, useGTMutation, useGTQueryClient } from '../queryUtils'
import { createNewTaskV4Helper } from './tasksv4.hooks'

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

export const useModifyTask = () => {
    const queryClient = useGTQueryClient()
    return useGTMutation((data: TModifyTaskData) => modifyTask(data), {
        tag: 'tasks_v4',
        invalidateTagsOnSettled: ['tasks_v4', 'overview'],
        onMutate: async (data: TModifyTaskData) => {
            await Promise.all([queryClient.cancelQueries('overview'), queryClient.cancelQueries('tasks_v4')])

            const tasks = queryClient.getImmutableQueryData<TTaskV4[]>('tasks_v4')
            if (tasks) {
                const updatedTasks = produce(tasks, (draft) => {
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
                    task.recurring_task_template_id = data.recurringTaskTemplateId ?? task.recurring_task_template_id
                    if (data.external_priority_id) {
                        const newPriority = task.all_priorities?.find(
                            (priority) => priority.external_id === data.external_priority_id
                        )
                        if (newPriority) task.priority = newPriority
                    }
                    task.updated_at = DateTime.utc().toISO()
                })
                queryClient.setQueryData('tasks_v4', updatedTasks)
            }
        },
    })
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

export const useMarkTaskDoneOrDeleted = () => {
    const queryClient = useGTQueryClient()
    const [overviewAutomaticEmptySort] = useGTLocalStorage('overviewAutomaticEmptySort', false, true)
    const navigate = useNavigate()
    const { setOpenListIds } = useOverviewContext()

    return useGTMutation((data: TMarkTaskDoneOrDeletedData) => markTaskDoneOrDeleted(data), {
        tag: 'tasks',
        invalidateTagsOnSettled: ['tasks_v4', 'folders', 'overview'],
        onMutate: async (data: TMarkTaskDoneOrDeletedData) => {
            await Promise.all([
                queryClient.cancelQueries('tasks_v4'),
                queryClient.cancelQueries('folders'),
                queryClient.cancelQueries('overview'),
            ])
            const tasks = queryClient.getImmutableQueryData<TTaskV4[]>('tasks_v4')
            const updateTasks = async () => {
                if (!tasks) return
                const updatedTasks = produce(tasks, (draft) => {
                    const task = draft.find((task) => task.id === data.id)
                    if (!task) return
                    if (data.isDone !== undefined) {
                        task.is_done = data.isDone
                        if (data.isDone) task.id_folder = DONE_FOLDER_ID
                    }
                    if (data.isDeleted !== undefined) {
                        task.is_deleted = data.isDeleted
                        if (data.isDeleted) task.id_folder = TRASH_FOLDER_ID
                    }
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
                queryClient.setQueryData('tasks', updatedFolders)
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
                            if (a.view_items.length === 0 && b.view_items.length > 0) return 1
                            if (a.view_items.length > 0 && b.view_items.length === 0) return -1
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
        },
    })
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

const reorderSubtasks = (data: TReorderTaskData, queryClient: GTQueryClient) => {
    const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
    const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
    if (sections) {
        const newSections = produce(sections, (draft) => {
            const section = draft.find((s) => s.id === data.dropSectionId)
            if (!section) return
            const task = section?.tasks.find((t) => t.id === data.parentId)
            if (!task) return
            const subtasks = task.sub_tasks
            if (!subtasks) return

            const startIndex = subtasks.findIndex((s) => s.id === data.id)
            if (startIndex === -1) return
            let endIndex = data.orderingId - 1
            if (startIndex < endIndex) endIndex -= 1
            arrayMoveInPlace(subtasks, startIndex, endIndex)
            resetOrderingIds(subtasks)
        })
        queryClient.setQueryData('tasks', newSections)
    }
    if (views) {
        const newViews = produce(views, (draft) => {
            const view = draft.find((v) => v.task_section_id === data.dropSectionId)
            if (!view) return
            const task = view.view_items.find((t) => t.id === data.parentId)
            if (!task) return
            const subtasks = task.sub_tasks
            if (!subtasks) return

            const startIndex = subtasks.findIndex((s) => s.id === data.id)
            if (startIndex === -1) return
            let endIndex = data.orderingId - 1
            if (startIndex < endIndex) endIndex -= 1
            arrayMoveInPlace(subtasks, startIndex, endIndex)
            resetOrderingIds(subtasks)
        })
        queryClient.setQueryData('overview', newViews)
    }

    const tasks_v4 = queryClient.getImmutableQueryData<TTaskV4[]>('tasks_v4')
    if (tasks_v4) {
        const updatedTasks = produce(tasks_v4, (draft) => {
            const subtask = draft.find((task) => task.id === data.id)
            if (!subtask) return
            subtask.id_ordering = data.orderingId
            const parentSubtasks = draft
                .filter((task) => task.id_parent === data.parentId)
                .sort((a, b) => a.id_ordering - b.id_ordering)
            resetOrderingIds(parentSubtasks)
        })
        queryClient.setQueryData('tasks', updatedTasks)
    }
}

export const useReorderTask = () => {
    const queryClient = useGTQueryClient()
    return useGTMutation((data: TReorderTaskData) => reorderTask(data), {
        tag: 'tasks',
        invalidateTagsOnSettled: ['tasks', 'tasks_v4', 'overview'],
        onMutate: async (data: TReorderTaskData) => {
            await Promise.all([
                queryClient.cancelQueries('overview-supported-views'),
                queryClient.cancelQueries('overview'),
                queryClient.cancelQueries('tasks'),
                queryClient.cancelQueries('tasks_v4'),
            ])
            if (data.isSubtask) {
                reorderSubtasks(data, queryClient)
                return
            }
            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            const tasks_v4 = queryClient.getImmutableQueryData<TTaskV4[]>('tasks_v4')
            const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
            if (sections) {
                const newSections = produce(sections, (draft) => {
                    // move within the existing section
                    if (!data.dragSectionId || data.dragSectionId === data.dropSectionId) {
                        const section = draft.find((s) => s.id === data.dropSectionId)
                        if (section == null) return
                        const startIndex = section.tasks.findIndex((t) => t.id === data.id)
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
                        const dragTaskIndex = dragSection.tasks.findIndex((task) => task.id === data.id)
                        if (dragTaskIndex === -1) return
                        const dragTask = dragSection.tasks[dragTaskIndex]
                        dragSection.tasks.splice(dragTaskIndex, 1)

                        // change done/trash status if needed
                        dragTask.is_done = data.dropSectionId === DONE_FOLDER_ID
                        dragTask.is_deleted = data.dropSectionId === TRASH_FOLDER_ID

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
            if (tasks_v4) {
                const updatedTasks = produce(tasks_v4, (draft) => {
                    const task = draft.find((task) => task.id === data.id)
                    if (!task) return
                    task.id_ordering = data.orderingId
                    task.id_folder = data.dropSectionId
                    task.is_done = data.dropSectionId === DONE_FOLDER_ID
                    task.is_deleted = data.dropSectionId === TRASH_FOLDER_ID
                    const dropFolder = draft
                        .filter((task) => task.id_folder === data.dropSectionId && !task.id_parent)
                        .sort((a, b) => a.id_ordering - b.id_ordering)
                    resetOrderingIds(dropFolder)
                })
                queryClient.setQueryData('tasks_v4', updatedTasks)
            }
            if (views) {
                const newViews = produce(views, (draft) => {
                    // move within the existing section
                    if (!data.dragSectionId || data.dragSectionId === data.dropSectionId) {
                        const section = draft.find((view) => view.task_section_id === data.dropSectionId)
                        if (section == null) return
                        const startIndex = section.view_items.findIndex((t) => t.id === data.id)
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
                        const dragTaskIndex = dragSection.view_items.findIndex((item) => item.id === data.id)
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

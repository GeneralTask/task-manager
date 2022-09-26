import produce, { castImmutable } from "immer"
import { QueryFunctionContext, useMutation, useQuery } from "react-query"
import { v4 as uuidv4 } from 'uuid'
import apiClient from "../../utils/api"
import { useGTQueryClient } from "../queryUtils"
import { arrayMoveInPlace, getTaskFromFolders, getTaskIndexFromFolders, resetOrderingIds } from "../../utils/utils"
import { TASK_MARK_AS_DONE_TIMEOUT, TASK_REFETCH_INTERVAL } from "../../constants"
import { TTaskFolder, TTask, TOverviewView, TOverviewItem, TExternalStatus } from "../../utils/types"

export interface TCreateTaskData {
    title: string
    body?: string
    taskFolderId: string
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
    id_task_folder?: string
    id_ordering?: number
    title?: string
    due_date?: string
    time_duration?: number
    body?: string
}

export interface TMarkTaskDoneData {
    taskId: string
    folderId?: string
    isDone: boolean
}

export interface TReorderTaskData {
    taskId: string
    dropFolderId: string
    orderingId: number
    dragFolderId?: string
}

export const useGetTasks = (isEnabled = true) => {
    return useQuery<TTaskFolder[], void>('tasks', getTasks, { enabled: isEnabled })
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
        },
        refetchInterval: TASK_REFETCH_INTERVAL * 1000,
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

export const useCreateTask = () => {
    const queryClient = useGTQueryClient()
    const optimisticId = uuidv4()
    return useMutation((data: TCreateTaskData) => createTask(data), {
        onMutate: async (data: TCreateTaskData) => {
            const folders = queryClient.getImmutableQueryData<TTaskFolder[]>('tasks')
            const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
            await Promise.all([
                queryClient.cancelQueries('overview-supported-views'),
                queryClient.cancelQueries('overview'),
                queryClient.cancelQueries('tasks'),
            ])

            if (folders) {
                const updatedFolders = produce(folders, (draft) => {
                    const folder = draft.find((folder) => folder.id === data.taskFolderId)
                    if (!folder) return
                    const orderingId = folder.tasks.length > 0 ? folder.tasks[0].id_ordering - 1 : 1
                    const newTask: TTask = {
                        id: optimisticId,
                        id_ordering: orderingId,
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
                        isOptimistic: true,
                        is_meeting_preparation_task: false,
                    }
                    folder.tasks = [newTask, ...folder.tasks]
                })
                queryClient.setQueryData('tasks', updatedFolders)
            }
            if (views) {
                const updatedViews = produce(views, (draft) => {
                    const folder = draft.find(view => view.task_folder_id === data.taskFolderId)
                    if (!folder) return
                    const orderingId = folder.view_items.length > 0 ? folder.view_items[0].id_ordering - 1 : 1
                    const newTask = <TOverviewItem>{
                        id: optimisticId,
                        id_ordering: orderingId,
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
                        isOptimistic: true,
                    }
                    folder.view_items = [newTask, ...folder.view_items]
                })
                queryClient.setQueryData('overview', updatedViews)
            }
        },
        onSuccess: async (response: TCreateTaskResponse, createData: TCreateTaskData) => {
            const folders = queryClient.getImmutableQueryData<TTaskFolder[]>('tasks')
            const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')

            if (folders) {
                const updatedFolders = produce(folders, (draft) => {
                    const task = getTaskFromFolders(draft, optimisticId, createData.taskFolderId)
                    if (!task?.id) return
                    task.id = response.task_id
                    task.isOptimistic = false
                })
                queryClient.setQueryData('tasks', updatedFolders)
            }
            if (views) {
                const updatedViews = produce(views, (draft) => {
                    const folder = draft.find((folder) => folder.task_folder_id === createData.taskFolderId)
                    const task = folder?.view_items.find((task) => task.id === optimisticId)
                    if (!task) return
                    task.id = response.task_id
                    task.isOptimistic = false
                })
                queryClient.setQueryData('overview', updatedViews)
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries('tasks')
            queryClient.invalidateQueries('overview')
        },
    })
}
export const createTask = async (data: TCreateTaskData) => {
    try {
        const res = await apiClient.post('/tasks/create/gt_task/', {
            title: data.title,
            body: data.body ?? '',
            id_task_folder: data.taskFolderId,
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('createTask failed')
    }
}

export const useModifyTask = () => {
    const queryClient = useGTQueryClient()
    return useMutation(
        (data: TModifyTaskData) =>
            modifyTask(data),
        {
            onMutate: async (data: TModifyTaskData) => {
                await Promise.all([
                    queryClient.cancelQueries('overview-supported-views'),
                    queryClient.cancelQueries('overview'),
                    queryClient.cancelQueries('tasks'),
                ])

                const folders = queryClient.getImmutableQueryData<TTaskFolder[]>('tasks')
                if (folders) {

                    const newFolders = produce(folders, (draft) => {
                        const task = getTaskFromFolders(draft, data.id)
                        if (!task) return
                        task.title = data.title || task.title
                        task.due_date = data.dueDate || task.due_date
                        task.time_allocated = data.timeAllocated || task.time_allocated
                        task.body = data.body || task.body
                        task.priority_normalized = data.priorityNormalized || task.priority_normalized
                        task.external_status = data.status || task.external_status
                    })

                    queryClient.setQueryData('tasks', newFolders)
                }

                const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
                if (views) {

                    const newViews = produce(views, (draft) => {
                        const folders = views.map(view => ({
                            id: view.task_folder_id,
                            tasks: view.view_items
                        }))
                        const { taskIndex, folderIndex } = getTaskIndexFromFolders(folders, data.id)
                        if (folderIndex === undefined || taskIndex === undefined) return
                        const task = draft[folderIndex].view_items[taskIndex]
                        if (!task) return
                        task.title = data.title || task.title
                        task.due_date = data.dueDate || task.due_date
                        task.time_allocated = data.timeAllocated || task.time_allocated
                        task.body = data.body || task.body
                        task.priority_normalized = data.priorityNormalized || task.priority_normalized
                        task.external_status = data.status || task.external_status
                    })

                    queryClient.setQueryData('overview', newViews)
                }

            },
            onSettled: () => {
                queryClient.invalidateQueries('tasks')
                queryClient.invalidateQueries('overview')
            },
        }
    )
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

export const useMarkTaskDone = () => {
    const queryClient = useGTQueryClient()
    return useMutation((data: TMarkTaskDoneData) => markTaskDone(data), {
        onMutate: async (data: TMarkTaskDoneData) => {
            const folders = queryClient.getImmutableQueryData<TTaskFolder[]>('tasks')
            const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
            await Promise.all([
                queryClient.cancelQueries('tasks'),
                queryClient.cancelQueries('overview'),
            ])

            if (folders) {
                const newFolders = produce(folders, (draft) => {
                    const task = getTaskFromFolders(draft, data.taskId, data.folderId)
                    if (task) {
                        task.is_done = data.isDone
                        if (task.is_done) {
                            if (task.source.name === 'Linear' && task.external_status) {
                                task.external_status.state = 'Done'
                                task.external_status.type = 'completed'
                            }
                        }
                    }
                })

                queryClient.setQueryData('tasks', newFolders)

                if (data.isDone) {
                    setTimeout(() => {
                        const folders = queryClient.getImmutableQueryData<TTaskFolder[]>('tasks')
                        if (!folders) return

                        const newFolders = produce(folders, (draft) => {
                            const { taskIndex, folderIndex } = getTaskIndexFromFolders(draft, data.taskId)
                            if (taskIndex === undefined || folderIndex === undefined) return
                            if (draft[folderIndex].tasks[taskIndex].is_done) {
                                const task = draft[folderIndex].tasks.splice(taskIndex, 1)
                                draft.find((s) => s.is_done)?.tasks.unshift(...task)
                            }
                        })

                        queryClient.setQueryData('tasks', newFolders)
                        queryClient.invalidateQueries('tasks')
                    }, TASK_MARK_AS_DONE_TIMEOUT * 1000)
                }
            }
            if (views) {
                const newViews = produce(views, (draft) => {
                    const folders = views.map(view => ({
                        id: view.task_folder_id,
                        tasks: view.view_items
                    }))
                    const { taskIndex, folderIndex } = getTaskIndexFromFolders(folders, data.taskId, data.folderId)
                    if (folderIndex === undefined || taskIndex === undefined) return
                    const task = draft[folderIndex].view_items[taskIndex]
                    task.is_done = data.isDone
                    if (task.is_done && task.source.name === 'Linear' && task.external_status) {
                        task.external_status.state = 'Done'
                        task.external_status.type = 'completed'
                    }
                })

                queryClient.setQueryData('overview', newViews)

                if (data.isDone) {
                    setTimeout(() => {
                        const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
                        if (!views) return

                        const newViews = produce(views, (draft) => {
                            const folders = views.map(view => ({
                                id: view.task_folder_id,
                                tasks: view.view_items
                            }))
                            const { taskIndex, folderIndex } = getTaskIndexFromFolders(folders, data.taskId, data.folderId)
                            if (folderIndex === undefined || taskIndex === undefined) return
                            if (draft[folderIndex].view_items[taskIndex].is_done) {
                                draft[folderIndex].view_items.splice(taskIndex, 1)
                            }
                        })

                        queryClient.setQueryData('overview', newViews)
                        queryClient.invalidateQueries('overview')
                    }, TASK_MARK_AS_DONE_TIMEOUT * 1000)
                }
            }
        },
    })
}
export const markTaskDone = async (data: TMarkTaskDoneData) => {
    try {
        const res = await apiClient.patch(`/tasks/modify/${data.taskId}/`, { is_completed: data.isDone })
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
                const folders = queryClient.getImmutableQueryData<TTaskFolder[]>('tasks')
                const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
                await Promise.all([
                    queryClient.cancelQueries('overview-supported-views'),
                    queryClient.cancelQueries('overview'),
                    queryClient.cancelQueries('tasks'),
                ])

                if (folders) {
                    const newFolders = produce(folders, (draft) => {
                        // move within the existing folder
                        if (!data.dragFolderId || data.dragFolderId === data.dropFolderId) {
                            const folder = draft.find((s) => s.id === data.dropFolderId)
                            if (folder == null) return
                            const startIndex = folder.tasks.findIndex((t) => t.id === data.taskId)
                            if (startIndex === -1) return
                            let endIndex = data.orderingId - 1
                            if (startIndex < endIndex) {
                                endIndex -= 1
                            }
                            arrayMoveInPlace(folder.tasks, startIndex, endIndex)

                            // update ordering ids
                            resetOrderingIds(folder.tasks)
                        }
                        // move task from one folder to the other
                        else {
                            // remove task from old location
                            const dragFolder = draft.find((folder) => folder.id === data.dragFolderId)
                            if (dragFolder == null) return
                            const dragTaskIndex = dragFolder.tasks.findIndex((task) => task.id === data.taskId)
                            if (dragTaskIndex === -1) return
                            const dragTask = dragFolder.tasks[dragTaskIndex]
                            dragFolder.tasks.splice(dragTaskIndex, 1)

                            // add task to new location
                            const dropFolder = draft.find((folder) => folder.id === data.dropFolderId)
                            if (dropFolder == null) return
                            dropFolder.tasks.splice(data.orderingId - 1, 0, dragTask)

                            // update ordering ids
                            resetOrderingIds(dropFolder.tasks)
                            resetOrderingIds(dragFolder.tasks)
                        }
                    })
                    queryClient.setQueryData('tasks', newFolders)
                }
                if (views) {
                    const newViews = produce(views, (draft) => {
                        // move within the existing folder
                        if (!data.dragFolderId || data.dragFolderId === data.dropFolderId) {
                            const folder = draft.find(view => view.task_folder_id === data.dropFolderId)
                            if (folder == null) return
                            const startIndex = folder.view_items.findIndex((t) => t.id === data.taskId)
                            if (startIndex === -1) return
                            let endIndex = data.orderingId - 1
                            if (startIndex < endIndex) {
                                endIndex -= 1
                            }
                            arrayMoveInPlace(folder.view_items, startIndex, endIndex)

                            // update ordering ids
                            resetOrderingIds(folder.view_items)
                        }
                        // move task from one folder to the other
                        else {
                            // remove task from old location
                            const dragFolder = draft.find((folder) => folder.task_folder_id === data.dragFolderId)
                            if (dragFolder == null) return
                            const dragTaskIndex = dragFolder.view_items.findIndex((item) => item.id === data.taskId)
                            if (dragTaskIndex === -1) return
                            const dragTask = dragFolder.view_items[dragTaskIndex]
                            dragFolder.view_items.splice(dragTaskIndex, 1)

                            // add task to new location
                            const dropFolder = draft.find((folder) => folder.task_folder_id === data.dropFolderId)
                            if (dropFolder == null) return
                            dropFolder.view_items.splice(data.orderingId - 1, 0, dragTask)

                            // update ordering ids
                            resetOrderingIds(dropFolder.view_items)
                            resetOrderingIds(dragFolder.view_items)
                        }
                    })
                    queryClient.setQueryData('overview', newViews)
                }
            },
            onSettled: () => {
                queryClient.invalidateQueries('tasks')
                queryClient.invalidateQueries('overview')
            },
        }
    )
}
export const reorderTask = async (data: TReorderTaskData) => {
    try {
        const res = await apiClient.patch(`/tasks/modify/${data.taskId}/`, {
            id_task_folder: data.dropFolderId,
            id_ordering: data.orderingId,
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('reorderTask failed')
    }
}

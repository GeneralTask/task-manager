import produce, { castImmutable } from "immer"
import { useMutation, useQuery } from "react-query"
import { v4 as uuidv4 } from 'uuid'
import apiClient from "../../utils/api"
import { useGTQueryClient } from "../queryUtils"
import { arrayMoveInPlace, getTaskFromSections, getTaskIndexFromSections, resetOrderingIds } from "../../utils/utils"
import { TASK_MARK_AS_DONE_TIMEOUT } from "../../constants"
import { TTaskSection, TTask, TOverviewView, TOverviewItem } from "../../utils/types"

export interface TCreateTaskData {
    title: string
    body?: string
    taskSectionId: string
}

export interface TCreateTaskResponse {
    task_id: string
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

export interface TMarkTaskDoneData {
    taskId: string
    sectionId?: string
    isCompleted: boolean
}

export interface TReorderTaskData {
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
            const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
            const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
            await queryClient.cancelQueries('tasks')
            await queryClient.cancelQueries('overview')

            if (sections) {
                const updatedSections = produce(sections, (draft) => {
                    const section = draft.find((section) => section.id === data.taskSectionId)
                    if (!section) return
                    const orderingId = section.tasks.length > 0 ? section.tasks[0].id_ordering - 1 : 1
                    const newTask: TTask = {
                        id: optimisticId,
                        id_ordering: orderingId,
                        title: data.title,
                        body: data.body ?? '',
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
                        isOptimistic: true,
                    }
                    section.tasks = [newTask, ...section.tasks]
                })
                queryClient.setQueryData('tasks', updatedSections)
            }
            if (views) {
                const updatedViews = produce(views, (draft) => {
                    const section = draft.find(view => view.task_section_id === data.taskSectionId)
                    if (!section) return
                    const orderingId = section.view_items.length > 0 ? section.view_items[0].id_ordering - 1 : 1
                    const newTask = <TOverviewItem>{
                        id: optimisticId,
                        id_ordering: orderingId,
                        title: data.title,
                        body: data.body ?? '',
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
                        isOptimistic: true,
                    }
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
                    const task = getTaskFromSections(draft, optimisticId, createData.taskSectionId)
                    if (!task) return
                    task.id = response.task_id
                    task.isOptimistic = false
                })
                queryClient.setQueryData('tasks', updatedSections)
            }
            if (views) {
                const updatedViews = produce(views, (draft) => {
                    const section = draft.find((section) => section.task_section_id === createData.taskSectionId)
                    const task = section?.view_items.find((task) => task.id === optimisticId)
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
            id_task_section: data.taskSectionId,
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
                await queryClient.cancelQueries('overview')
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
                queryClient.invalidateQueries('overview')
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
                const task = getTaskFromSections(draft, data.taskId, data.sectionId)
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
                        if (draft[sectionIndex].tasks[taskIndex].is_done) {
                            draft[sectionIndex].tasks.splice(taskIndex, 1)
                        }
                    })

                    queryClient.setQueryData('tasks', newSections)
                    queryClient.invalidateQueries('tasks')
                }, TASK_MARK_AS_DONE_TIMEOUT * 1000)
            }
        },
    })
}
export const markTaskDone = async (data: TMarkTaskDoneData) => {
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
                const sections = queryClient.getImmutableQueryData<TTaskSection[]>('tasks')
                const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
                await queryClient.cancelQueries('tasks')
                await queryClient.cancelQueries('overview')

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
                            const section = draft.find(view => view.task_section_id === data.dropSectionId)
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
            id_task_section: data.dropSectionId,
            id_ordering: data.orderingId,
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('reorderTask failed')
    }
}

import produce, { castImmutable } from "immer"
import { v4 as uuidv4 } from 'uuid'
import { useMutation, useQuery } from "react-query"
import apiClient from "../../utils/api"
import { TOverviewView, TOverviewViewType, TSupportedView, TSupportedViewItem } from "../../utils/types"
import { useGTQueryClient } from "../queryUtils"
import { arrayMoveInPlace, getTaskIndexFromSections, resetOrderingIds } from "../../utils/utils"
import { markTaskDone, reorderTask, TMarkTaskDoneData, TReorderTaskData } from "./tasks.hooks"
import { TASK_MARK_AS_DONE_TIMEOUT } from "../../constants"

export const useGetOverviewViews = () => {
    return useQuery<TOverviewView[], void>('overview', getOverviewViews)
}
const getOverviewViews = async () => {
    try {
        const res = await apiClient.get('/overview/views/')
        return castImmutable(res.data)
    } catch {
        throw new Error('getTasks failed')
    }
}


interface TReorderViewData {
    viewId: string
    idOrdering: number
}
export const useReorderViews = () => {
    const queryClient = useGTQueryClient()
    return useMutation(
        (data: TReorderViewData) => reorderView(data),
        {
            onMutate: async ({ viewId, idOrdering }: TReorderViewData) => {
                await queryClient.cancelQueries('overview')

                const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
                if (!views) return

                const newViews = produce(views, draft => {
                    const startIndex = draft.findIndex(view => view.id === viewId)
                    let endIndex = idOrdering - 1
                    if (startIndex < endIndex) {
                        endIndex -= 1
                    }
                    if (startIndex === -1 || endIndex === -1) return
                    arrayMoveInPlace(draft, startIndex, endIndex)
                })

                queryClient.setQueryData('overview', newViews)
            },
            onSettled: () => {
                queryClient.invalidateQueries('overview')
            },
        }
    )
}
const reorderView = async (data: TReorderViewData) => {
    try {
        const res = await apiClient.patch(`/overview/views/${data.viewId}/`, {
            id_ordering: data.idOrdering,
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('reorderView failed')
    }
}

export const useGetSupportedViews = () => {
    return useQuery<TSupportedView[], void>('overview-supported-views', getSupportedViews)
}
const getSupportedViews = async () => {
    try {
        const res = await apiClient.get('/overview/supported_views/')
        return castImmutable(res.data)
    } catch {
        throw new Error('getSupportedViews failed')
    }
}

export interface TAddViewData {
    supportedView: TSupportedView
    supportedViewIndex: number
    supportedViewItem: TSupportedViewItem
    supportedViewItemIndex: number
}
interface TAddViewPayload {
    type: TOverviewViewType
    github_id?: string
    task_section_id?: string
    slack_id?: string
}
interface TAddViewReponse {
    id: string
}
export const useAddView = () => {
    const queryClient = useGTQueryClient()
    return useMutation<TAddViewReponse, unknown, TAddViewData, unknown>(
        ({ supportedView, supportedViewItem }: TAddViewData) => {
            const payload: TAddViewPayload = {
                type: supportedView.type,
                github_id: supportedViewItem.github_id || undefined,
                task_section_id: supportedViewItem.task_section_id || undefined,
                slack_id: supportedViewItem.slack_id || undefined,
            }
            return addView(payload)
        },
        {
            onMutate: async ({ supportedView, supportedViewIndex, supportedViewItem, supportedViewItemIndex }: TAddViewData) => {
                await Promise.all([
                    queryClient.cancelQueries('overview-supported-views'),
                    queryClient.cancelQueries('overview')
                ])

                const supportedViews = queryClient.getImmutableQueryData<TSupportedView[]>('overview-supported-views')
                if (supportedViews) {
                    const newSupportedViews = produce(supportedViews, draft => {
                        draft[supportedViewIndex].views[supportedViewItemIndex].is_added = true
                        draft[supportedViewIndex].views[supportedViewItemIndex].is_add_disabled = true
                    })
                    queryClient.setQueryData('overview-supported-views', newSupportedViews)
                }

                const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
                if (views) {
                    const newViews = produce(views, draft => {
                        const optimisticView: TOverviewView = {
                            id: uuidv4(),
                            name: supportedViewItem.name,
                            type: supportedView.type,
                            task_section_id: supportedViewItem.task_section_id,
                            is_reorderable: false,
                            logo: supportedView.logo,
                            view_items: [],
                            isOptimistic: true,
                            sources: [], 
                            is_linked: true 
                        }
                        draft.push(optimisticView)
                    })
                    queryClient.setQueryData('overview', newViews)
                }
            },
            onSettled: (data, _, { supportedViewIndex, supportedViewItemIndex }) => {
                queryClient.invalidateQueries('overview')
                queryClient.invalidateQueries('overview-supported-views')
                if (data) {
                    const supportedViews = queryClient.getImmutableQueryData<TSupportedView[]>('overview-supported-views')
                    if (supportedViews) {
                        const newSupportedViews = produce(supportedViews, draft => {
                            draft[supportedViewIndex].views[supportedViewItemIndex].id = data.id
                        })
                        queryClient.setQueryData('overview-supported-views', newSupportedViews)
                    }
                }
            },
        },
    )
}
const addView = async (data: TAddViewPayload) => {
    try {
        const res = await apiClient.post('/overview/views/', data)
        return castImmutable(res.data)
    } catch {
        throw new Error('addView failed')
    }
}

export const useRemoveView = () => {
    const queryClient = useGTQueryClient()
    return useMutation(
        (viewId: string) => removeView(viewId),
        {
            onMutate: async (viewId: string) => {
                await Promise.all([
                    queryClient.cancelQueries('overview-supported-views'),
                    queryClient.cancelQueries('overview')
                ])

                const supportedViews = queryClient.getImmutableQueryData<TSupportedView[]>('overview-supported-views')
                if (supportedViews) {
                    const newSupportedViews = produce(supportedViews, draft => {
                        let found = false
                        for (const view of draft) {
                            for (const viewItem of view.views) {
                                if (viewItem.id === viewId) {
                                    viewItem.is_added = false
                                    viewItem.is_add_disabled = false
                                    found = true
                                    break
                                }
                            }
                            if (found) break
                        }
                    })
                    queryClient.setQueryData('overview-supported-views', newSupportedViews)
                }

                const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
                if (views) {
                    const newViews = produce(views, draft => {
                        for (const view of draft) {
                            if (view.id === viewId) {
                                draft.splice(draft.indexOf(view), 1)
                                break
                            }
                        }
                    })
                    queryClient.setQueryData('overview', newViews)
                }
            }
        }
    )
}
const removeView = async (viewId: string) => {
    try {
        await apiClient.delete(`/overview/views/${viewId}/`)
    } catch {
        throw new Error('removeView failed')
    }
}
export const useMarkTaskDone = () => {
    const queryClient = useGTQueryClient()
    return useMutation((data: TMarkTaskDoneData) => markTaskDone(data), {
        onMutate: async (data: TMarkTaskDoneData) => {
            await queryClient.cancelQueries('overview')
            await queryClient.cancelQueries('tasks')

            const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
            if (!views) return

            const newViews = produce(views, (draft) => {
                const sections = views.map(view => ({
                    id: view.task_section_id,
                    tasks: view.view_items
                }))
                const { taskIndex, sectionIndex } = getTaskIndexFromSections(sections, data.taskId, data.sectionId)
                if (sectionIndex === undefined || taskIndex === undefined) return
                draft[sectionIndex].view_items[taskIndex].is_done = data.isCompleted
            })

            queryClient.setQueryData('overview', newViews)

            if (data.isCompleted) {
                setTimeout(() => {
                    const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
                    if (!views) return

                    const newViews = produce(views, (draft) => {
                        const sections = views.map(view => ({
                            id: view.task_section_id,
                            tasks: view.view_items
                        }))
                        const { taskIndex, sectionIndex } = getTaskIndexFromSections(sections, data.taskId, data.sectionId)
                        if (sectionIndex === undefined || taskIndex === undefined) return
                        if (draft[sectionIndex].view_items[taskIndex].is_done) {
                            draft[sectionIndex].view_items.splice(taskIndex, 1)
                        }
                    })

                    queryClient.setQueryData('overview', newViews)
                    queryClient.invalidateQueries('overview')
                    queryClient.invalidateQueries('tasks')
                }, TASK_MARK_AS_DONE_TIMEOUT * 1000)
            }
        },
    })
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

                const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
                if (!views) return

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
                        const dragSection = draft.find((section) => section.id === data.dragSectionId)
                        if (dragSection == null) return
                        const dragTaskIndex = dragSection.view_items.findIndex((item) => item.id === data.taskId)
                        if (dragTaskIndex === -1) return
                        const dragTask = dragSection.view_items[dragTaskIndex]
                        dragSection.view_items.splice(dragTaskIndex, 1)

                        // add task to new location
                        const dropSection = draft.find((section) => section.id === data.dropSectionId)
                        if (dropSection == null) return
                        dropSection.view_items.splice(data.orderingId - 1, 0, dragTask)

                        // update ordering ids
                        resetOrderingIds(dropSection.view_items)
                        resetOrderingIds(dragSection.view_items)
                    }
                })
                queryClient.setQueryData('overview', newViews)
            },
            onSettled: () => {
                queryClient.invalidateQueries('overview')
            },
        }
    )
}

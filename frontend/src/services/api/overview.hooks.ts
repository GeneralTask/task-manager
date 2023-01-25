import { QueryFunctionContext, useQuery } from 'react-query'
import produce, { castImmutable } from 'immer'
import useQueryContext from '../../context/QueryContext'
import { useGTLocalStorage } from '../../hooks'
import apiClient from '../../utils/api'
import { TOverviewView, TOverviewViewType, TSupportedView, TSupportedViewItem } from '../../utils/types'
import { arrayMoveInPlace } from '../../utils/utils'
import { useGTQueryClient, useQueuedMutation } from '../queryUtils'

export const useGetOverviewViews = () => {
    return useQuery<TOverviewView[], void>('overview', getOverviewViews)
}
const getOverviewViews = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/overview/views/', { signal })
        return castImmutable(res.data)
    } catch {
        throw new Error('getTasks failed')
    }
}

interface TReorderViewData {
    id: string
    idOrdering: number
}
export const useReorderViews = () => {
    const queryClient = useGTQueryClient()
    const [, setIsUsingSmartPrioritization] = useGTLocalStorage('isUsingSmartPrioritization', false, true)
    return useQueuedMutation((data: TReorderViewData) => reorderView(data), {
        tag: 'overview',
        invalidateTagsOnSettled: ['overview'],
        onMutate: async ({ id, idOrdering }: TReorderViewData) => {
            setIsUsingSmartPrioritization(false)
            const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
            if (!views) return
            await Promise.all([queryClient.cancelQueries('overview'), queryClient.cancelQueries('tasks')])

            const newViews = produce(views, (draft) => {
                const startIndex = draft.findIndex((view) => view.id === id)
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
    })
}
const reorderView = async (data: TReorderViewData) => {
    try {
        const res = await apiClient.patch(`/overview/views/${data.id}/`, {
            id_ordering: data.idOrdering,
        })
        return castImmutable(res.data)
    } catch {
        throw new Error('reorderView failed')
    }
}

interface TBulkModifyViewsData {
    ordered_view_ids?: string[]
}
export const useBulkModifyViews = () => {
    const queryClient = useGTQueryClient()
    return useQueuedMutation((data: TBulkModifyViewsData) => bulkModifyViews(data), {
        tag: 'overview',
        invalidateTagsOnSettled: ['overview'],
        onMutate: async (data: TBulkModifyViewsData) => {
            const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
            if (!views) return
            await Promise.all([queryClient.cancelQueries('overview'), queryClient.cancelQueries('tasks')])
            const newViews = produce(views, (draft) => {
                // if ordered_view_ids is provided, reorder the views
                if (data.ordered_view_ids) {
                    const idToNewIndex = new Map(data.ordered_view_ids.map((id, index) => [id, index]))
                    draft.sort((a, b) => {
                        const aIndex = idToNewIndex.get(a.id)
                        const bIndex = idToNewIndex.get(b.id)
                        if (aIndex === undefined || bIndex === undefined) return 0
                        return aIndex - bIndex
                    })
                }
            })
            queryClient.setQueryData('overview', newViews)
        },
    })
}

const bulkModifyViews = async (data: TBulkModifyViewsData) => {
    try {
        const res = await apiClient.patch('/overview/views/bulk_modify/', data)
        return castImmutable(res.data)
    } catch {
        throw new Error('bulkModifyViews failed')
    }
}

export const useGetSupportedViews = () => {
    return useQuery<TSupportedView[], void>('overview-supported-views', getSupportedViews)
}
const getSupportedViews = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/overview/supported_views/', { signal })
        return castImmutable(res.data)
    } catch {
        throw new Error('getSupportedViews failed')
    }
}

export interface TAddViewData {
    optimisticId: string
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
    const { setOptimisticId } = useQueryContext()
    const [, setIsUsingSmartPrioritization] = useGTLocalStorage('isUsingSmartPrioritization', false, true)

    return useQueuedMutation<TAddViewReponse, unknown, TAddViewData, unknown>(
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
            tag: 'overview',
            invalidateTagsOnSettled: ['overview', 'overview-supported-views'],
            onMutate: async ({
                optimisticId,
                supportedView,
                supportedViewIndex,
                supportedViewItem,
                supportedViewItemIndex,
            }: TAddViewData) => {
                setIsUsingSmartPrioritization(false)
                await Promise.all([
                    queryClient.cancelQueries('overview-supported-views'),
                    queryClient.cancelQueries('overview'),
                ])

                const supportedViews = queryClient.getImmutableQueryData<TSupportedView[]>('overview-supported-views')
                if (supportedViews) {
                    const newSupportedViews = produce(supportedViews, (draft) => {
                        draft[supportedViewIndex].views[supportedViewItemIndex].is_added = true
                        draft[supportedViewIndex].views[supportedViewItemIndex].view_id = optimisticId
                        draft[supportedViewIndex].views[supportedViewItemIndex].optimisticId = optimisticId
                    })
                    queryClient.setQueryData('overview-supported-views', newSupportedViews)
                }

                const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
                if (views) {
                    const newViews = produce(views, (draft) => {
                        const optimisticView: TOverviewView = {
                            id: optimisticId,
                            optimisticId,
                            name: supportedViewItem.name,
                            type: supportedView.type,
                            task_section_id: supportedViewItem.task_section_id,
                            is_reorderable: false,
                            logo: supportedView.logo,
                            view_items: [],
                            sources: [],
                            is_linked: true,
                            has_tasks_completed_today: false,
                        }
                        draft.push(optimisticView)
                    })
                    queryClient.setQueryData('overview', newViews)
                }
            },
            onSuccess: (data, { optimisticId, supportedViewIndex, supportedViewItemIndex }) => {
                if (!data) return
                setOptimisticId(optimisticId, data.id)
                const supportedViews = queryClient.getImmutableQueryData<TSupportedView[]>('overview-supported-views')
                if (supportedViews) {
                    const newSupportedViews = produce(supportedViews, (draft) => {
                        draft[supportedViewIndex].views[supportedViewItemIndex].view_id = data.id
                    })
                    queryClient.setQueryData('overview-supported-views', newSupportedViews)
                }
            },
        }
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

interface TRemoveViewData {
    id: string
}
export const useRemoveView = () => {
    const queryClient = useGTQueryClient()
    const [, setIsUsingSmartPrioritization] = useGTLocalStorage('isUsingSmartPrioritization', false, true)

    return useQueuedMutation(({ id }: TRemoveViewData) => removeView(id), {
        tag: 'overview',
        invalidateTagsOnSettled: ['overview', 'overview-supported-views'],
        onMutate: async ({ id }) => {
            setIsUsingSmartPrioritization(false)
            const supportedViews = queryClient.getImmutableQueryData<TSupportedView[]>('overview-supported-views')
            const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
            await Promise.all([
                queryClient.cancelQueries('overview-supported-views'),
                queryClient.cancelQueries('overview'),
            ])

            if (supportedViews) {
                const newSupportedViews = produce(supportedViews, (draft) => {
                    let found = false
                    for (const view of draft) {
                        for (const viewItem of view.views) {
                            if (viewItem.view_id === id) {
                                viewItem.is_added = false
                                viewItem.view_id = ''
                                found = true
                                break
                            }
                        }
                        if (found) break
                    }
                })
                queryClient.setQueryData('overview-supported-views', newSupportedViews)
            }

            if (views) {
                const newViews = produce(views, (draft) => {
                    for (const view of draft) {
                        if (view.id === id) {
                            draft.splice(draft.indexOf(view), 1)
                            break
                        }
                    }
                })
                queryClient.setQueryData('overview', newViews)
            }
        },
    })
}
const removeView = async (viewId: string) => {
    try {
        await apiClient.delete(`/overview/views/${viewId}/`)
    } catch {
        throw new Error('removeView failed')
    }
}

export const useSmartPrioritizationSuggestionsRemaining = () => {
    return useQuery<number>('overview-suggestions-remaining', getSmartPrioritizationSuggestionsRemaining, {
        refetchOnMount: 'always',
    })
}
const getSmartPrioritizationSuggestionsRemaining = async ({ signal }: QueryFunctionContext) => {
    try {
        const res = await apiClient.get('/overview/views/suggestions_remaining/', { signal })
        return castImmutable(res.data)
    } catch {
        throw new Error('getOverviewSuggestionsRemaining failed')
    }
}

export interface TOverviewSuggestion {
    id: string
    reasoning: string
}

export const getOverviewSmartSuggestion = async () => {
    const res = await apiClient.get('/overview/views/suggestion/')
    if (res.status !== 200) throw new Error('getOverviewSmartSuggestion failed')
    return res.data
}

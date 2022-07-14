import produce, { castImmutable } from "immer"
import { v4 as uuidv4 } from 'uuid'
import { useMutation, useQuery } from "react-query"
import apiClient from "../../utils/api"
import { TOverviewView, TOverviewViewType, TSupportedView, TSupportedViewItem } from "../../utils/types"
import { useGTQueryClient } from "../queryUtils"
import { arrayMoveInPlace } from "../../utils/utils"

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
    messages_id?: string
    task_section_id?: string
    slack_id?: string
}
export const useAddView = () => {
    const queryClient = useGTQueryClient()
    return useMutation(
        ({ supportedView, supportedViewItem }: TAddViewData) => {
            const payload: TAddViewPayload = {
                type: supportedView.type,
                github_id: supportedViewItem.github_id || undefined,
                messages_id: supportedViewItem.messages_id || undefined,
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
                        }
                        draft.push(optimisticView)
                    })
                    queryClient.setQueryData('overview', newViews)
                }
            },
            onSettled: () => {
                queryClient.invalidateQueries('overview-supported-views')
            },
        },
    )
}
const addView = async (data: TAddViewPayload) => {
    try {
        const res = await apiClient.post('/overview/supported_views/', data)
        return castImmutable(res.data)
    } catch {
        throw new Error('addView failed')
    }
}

import produce, { castImmutable } from "immer"
import { useMutation, useQuery } from "react-query"
import apiClient from "../../utils/api"
import { TOverviewView, TSupportedView } from "../../utils/types"
import { useGTQueryClient } from "../queryUtils"
import { arrayMoveInPlace, getTaskIndexFromSections } from "../../utils/utils"
import { TMarkTaskDoneData } from "../query-payload-types"
import { markTaskDone } from "./tasks.hooks"
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

export const useMarkTaskDone = () => {
    const queryClient = useGTQueryClient()
    return useMutation((data: TMarkTaskDoneData) => markTaskDone(data), {
        onMutate: async (data: TMarkTaskDoneData) => {
            await queryClient.cancelQueries('overview')

            const views = queryClient.getImmutableQueryData<TOverviewView[]>('overview')
            if (!views) return

            const newViews = produce(views, (draft) => {
                const sections = draft.map(view => ({
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
                }, TASK_MARK_AS_DONE_TIMEOUT * 1000)
            }
        },
    })
}

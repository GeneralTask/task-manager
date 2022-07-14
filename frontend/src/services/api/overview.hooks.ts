import produce, { castImmutable } from "immer"
import { useMutation, useQuery } from "react-query"
import apiClient from "../../utils/api"
import { TOverviewView, TSupportedView } from "../../utils/types"
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

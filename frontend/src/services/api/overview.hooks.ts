import produce, { castImmutable } from "immer"
import { useState } from "react"
import { useQuery } from "react-query"
import apiClient from "../../utils/api"
import { TOverviewView, TSupportedOverviewView } from "../../utils/types"
// import { arrayMoveInPlace } from "../../utils/utils"

const dummySupportedViews = [
    {
        id: 'default tasks',
        name: 'Default tasks',
        logo: 'generaltask',
        is_added: true,
    },
    {
        id: 'Work',
        name: 'Work',
        logo: 'generaltask',
        is_added: false,
    },
    {
        id: 'Home',
        name: 'Home',
        logo: 'generaltask',
        is_added: false,
    },
    {
        id: 'Github',
        name: 'Github',
        logo: 'github',
        is_added: true,
    },
    {
        id: 'Gmail',
        name: 'Gmail',
        logo: 'gmail',
        is_added: true,
    },
    {
        id: 'Linear',
        name: 'Linear',
        logo: 'linear',
        is_added: true,
    },
    {
        id: 'Slack',
        name: 'Slack',
        logo: 'slack',
        is_added: false,
    },
]

export const useGetOverviewViews = () => {
    return useQuery<TOverviewView[], void>('overview', getOverviewViews)
}
const getOverviewViews = async () => {
    try {
        const res = await apiClient.get('/overview/views/')
        console.log({ d: res.data })
        return castImmutable(res.data)
    } catch {
        throw new Error('getTasks failed')
    }
}

// export const useGetOverviewViews = () => {
//     const [views, setViews] = useState(dummyOverviewViews)

//     const temporaryReorderViews = (viewId: string, idOrdering: number) => {
//         const newViews = produce(views, draft => {
//             const startIndex = draft.findIndex(view => view.id === viewId)
//             let endIndex = idOrdering - 1
//             if (startIndex < endIndex) {
//                 endIndex -= 1
//             }
//             if (startIndex === -1 || endIndex === -1) return
//             arrayMoveInPlace(draft, startIndex, endIndex)
//         })
//         setViews(newViews)
//     }

//     return { data: views, isLoading: false, temporaryReorderViews }
// }


export const useGetSupportedViews = () => {
    const [supportedViews, setSupportedViews] = useState<TSupportedOverviewView[]>(dummySupportedViews)

    const temporaryAddOrRemoveViewFunc = (viewId: string, isAdded: boolean) => {
        const newSupportedViews = produce(supportedViews, draft => {
            const view = draft.find(view => view.id === viewId)
            if (view) {
                view.is_added = isAdded
            }
        })
        setSupportedViews(newSupportedViews)
    }

    return { data: supportedViews, temporaryAddOrRemoveViewFunc }
}


import produce from "immer"
import { useState } from "react"
import { TSupportedOverviewView } from "../../utils/types"

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
        is_added: false,
    },
    {
        id: 'Slack',
        name: 'Slack',
        logo: 'slack',
        is_added: false,
    },
]

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

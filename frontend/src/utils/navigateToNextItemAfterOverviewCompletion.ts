import { Dispatch, SetStateAction } from 'react'
import { NavigateFunction } from 'react-router-dom'
import { TOverviewView } from './types'

const navigateToNextItemAfterOverviewCompletion = (
    oldLists: TOverviewView[],
    newLists: TOverviewView[],
    deletedTaskId: string,
    navigate: NavigateFunction,
    setOpenListIds: Dispatch<SetStateAction<string[]>>
) => {
    const location = window.location.pathname.split('/')

    // Get list with deleted task
    const listWithDeletedTask = oldLists.find((list) => {
        return list.view_items.find((item) => item.id === deletedTaskId)
    })

    // If list has more than one task, navigate to next task
    if (listWithDeletedTask && listWithDeletedTask.view_items.length !== 1) {
        if (location[3] !== deletedTaskId) return
        const taskIndex = listWithDeletedTask.view_items.findIndex((item) => item.id === deletedTaskId)
        const nextTask = listWithDeletedTask.view_items[taskIndex + 1]
        if (nextTask) {
            navigate(`/overview/${listWithDeletedTask.id}/${nextTask.id}`)
        } else {
            const previousTask = listWithDeletedTask.view_items[taskIndex - 1]
            navigate(`/overview/${listWithDeletedTask.id}/${previousTask.id}`)
        }
    } else {
        // If list has only one task, navigate to first non-empty list
        const firstNonEmptyList = newLists.find((list) => list.view_items.length > 0)
        if (firstNonEmptyList) {
            setOpenListIds((openListIds) => {
                if (!openListIds.includes(firstNonEmptyList.id)) {
                    return [...openListIds, firstNonEmptyList.id]
                }
                return openListIds
            })
            navigate(`/overview/${firstNonEmptyList.id}/${firstNonEmptyList.view_items[0].id}`)
        } else {
            navigate(`/overview/`)
        }
    }
}
export default navigateToNextItemAfterOverviewCompletion

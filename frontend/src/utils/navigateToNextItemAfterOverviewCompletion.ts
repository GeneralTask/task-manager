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
        return list.view_item_ids.find((id) => id === deletedTaskId)
    })

    // If list has more than one task, navigate to next task
    if (listWithDeletedTask && listWithDeletedTask.view_item_ids.length !== 1) {
        if (location[3] !== deletedTaskId) return
        const taskIndex = listWithDeletedTask.view_item_ids.findIndex((id) => id === deletedTaskId)
        const nextTaskId = listWithDeletedTask.view_item_ids[taskIndex + 1]
        if (nextTaskId) {
            navigate(`/overview/${listWithDeletedTask.id}/${nextTaskId}`)
        } else {
            const previousTaskId = listWithDeletedTask.view_item_ids[taskIndex - 1]
            navigate(`/overview/${listWithDeletedTask.id}/${previousTaskId}`)
        }
    } else {
        // If list has only one task, navigate to first non-empty list
        const firstNonEmptyList = newLists.find((list) => list.view_item_ids.length > 0)
        if (firstNonEmptyList) {
            setOpenListIds((openListIds) => {
                if (!openListIds.includes(firstNonEmptyList.id)) {
                    return [...openListIds, firstNonEmptyList.id]
                }
                return openListIds
            })
            navigate(`/overview/${firstNonEmptyList.id}/${firstNonEmptyList.view_item_ids[0]}`)
        } else {
            navigate(`/overview/`)
        }
    }
}
export default navigateToNextItemAfterOverviewCompletion

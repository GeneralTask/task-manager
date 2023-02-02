import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import useOverviewContext from '../../../context/OverviewContextProvider'
import useKeyboardShortcut from '../../../hooks/useKeyboardShortcut'
import Log from '../../../services/api/log'
import { useGetOverviewViews } from '../../../services/api/overview.hooks'
import { useMarkTaskDoneOrDeleted } from '../../../services/api/tasks.hooks'
import { TOverviewView } from '../../../utils/types'
import GTCheckbox from '../GTCheckbox'

export const useNavigateToNextOverviewItem = () => {
    const navigate = useNavigate()
    const { setOpenListIds } = useOverviewContext()
    return (completedTaskId: string, lists: TOverviewView[]) => {
        const listWithTask = lists?.find((list) => {
            return list.view_items.find((item) => item.id === completedTaskId)
        })

        // Check if current list is not empty, and select next item if it is not
        if (listWithTask && listWithTask.view_items.length !== 1) {
            const taskIndex = listWithTask.view_items.findIndex((item) => item.id === completedTaskId)
            const nextTask = listWithTask.view_items[taskIndex + 1]
            if (nextTask) {
                navigate(`/overview/${listWithTask.id}/${nextTask.id}`)
            }
        } else {
            // Select first item in first non-empty list
            const firstNonEmptyList = lists?.find((list) => list.view_items.length > 0 && list.id !== listWithTask?.id)
            console.log('first non empty list', firstNonEmptyList)
            if (firstNonEmptyList) {
                //open this list
                navigate(`/overview/${firstNonEmptyList.id}/${firstNonEmptyList.view_items[0].id}`)
                //open this list item
                setOpenListIds((ids) => {
                    if (!ids.includes(firstNonEmptyList.id)) {
                        return [...ids, firstNonEmptyList.id]
                    }
                    return ids
                })
            } else {
                navigate(`/overview/`)
            }
        }
    }
}

interface MarkTaskDoneButtonProps {
    isDone: boolean
    taskId: string
    subtaskId?: string
    isSelected: boolean
    sectionId?: string
    isDisabled?: boolean
    onMarkComplete?: () => void
    optimsticId?: string
}
const MarkTaskDoneButton = ({
    isDone,
    taskId,
    subtaskId,
    isSelected,
    sectionId,
    isDisabled,
    onMarkComplete,
    optimsticId,
}: MarkTaskDoneButtonProps) => {
    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()
    const onMarkTaskDone = useCallback(() => {
        if (onMarkComplete) onMarkComplete()
        markTaskDoneOrDeleted(
            {
                id: taskId,
                sectionId: sectionId,
                subtaskId: subtaskId,
                isDone: !isDone,
                waitForAnimation: true,
            },
            optimsticId
        )

        Log({
            taskId: taskId,
            sectionId: sectionId,
            subtaskId: subtaskId,
            isDone: !isDone,
        })
    }, [taskId, sectionId, isDone, onMarkComplete])

    useKeyboardShortcut('markAsDone', onMarkTaskDone, !isSelected || isDisabled)
    return <GTCheckbox isChecked={isDone} onChange={onMarkTaskDone} animated />
}

export default MarkTaskDoneButton

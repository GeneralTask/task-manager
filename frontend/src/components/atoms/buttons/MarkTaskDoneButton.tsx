import { useCallback } from 'react'
import useKeyboardShortcut from '../../../hooks/useKeyboardShortcut'
import Log from '../../../services/api/log'
import { useMarkTaskDoneOrDeleted } from '../../../services/api/tasks.hooks'
import GTCheckbox from '../GTCheckbox'

interface MarkTaskDoneButtonProps {
    isDone: boolean
    taskId: string
    subtaskId?: string
    isSelected: boolean
    sectionId?: string
    isDisabled?: boolean
    onMarkComplete?: () => void
}
const MarkTaskDoneButton = ({
    isDone,
    taskId,
    subtaskId,
    isSelected,
    sectionId,
    isDisabled,
    onMarkComplete,
}: MarkTaskDoneButtonProps) => {
    const { mutate: markTaskDoneOrDeleted } = useMarkTaskDoneOrDeleted()
    const onMarkTaskDone = useCallback(() => {
        if (onMarkComplete) onMarkComplete()
        markTaskDoneOrDeleted({
            taskId: taskId,
            sectionId: sectionId,
            subtaskId: subtaskId,
            isDone: !isDone,
            waitForAnimation: true,
        })
        Log({
            taskId: taskId,
            sectionId: sectionId,
            subtaskId: subtaskId,
            isDone: !isDone,
        })
    }, [taskId, sectionId, isDone])

    useKeyboardShortcut('markAsDone', onMarkTaskDone, !isSelected || isDisabled)
    return <GTCheckbox isChecked={isDone} onChange={onMarkTaskDone} disabled={isDisabled} animated />
}

export default MarkTaskDoneButton

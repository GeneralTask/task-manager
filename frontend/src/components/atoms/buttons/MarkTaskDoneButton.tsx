import { useCallback } from 'react'
import { useToast } from '../../../hooks'
import useKeyboardShortcut from '../../../hooks/useKeyboardShortcut'
import Log from '../../../services/api/log'
import { useMarkTaskDoneOrDeleted } from '../../../services/api/tasks.hooks'
import GTCheckbox from '../GTCheckbox'
import { KeyboardShortcutContainer } from '../KeyboardShortcut'

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
    const toast = useToast()

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
    }, [taskId, sectionId, isDone])

    const onOldMarkTaskDone = useCallback(() => {
        toast.show(
            {
                message: (
                    <span>
                        This shortcut is deprecated — use <KeyboardShortcutContainer>Shift</KeyboardShortcutContainer>{' '}
                        <KeyboardShortcutContainer>D</KeyboardShortcutContainer> instead
                    </span>
                ),
            },
            {
                autoClose: 2000,
                pauseOnFocusLoss: false,
            }
        )
        // onMarkTaskDone()
    }, [onMarkTaskDone])

    useKeyboardShortcut('oldMarkAsDone', onOldMarkTaskDone, !isSelected || isDisabled)
    useKeyboardShortcut('markAsDone', onMarkTaskDone, !isSelected || isDisabled)

    return <GTCheckbox isChecked={isDone} onChange={onMarkTaskDone} animated />
}

export default MarkTaskDoneButton

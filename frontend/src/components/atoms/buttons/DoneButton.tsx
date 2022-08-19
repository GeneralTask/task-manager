import React from 'react'
import useKeyboardShortcut from '../../../hooks/useKeyboardShortcut'
import { useMarkTaskDone } from '../../../services/api/tasks.hooks'
import GTCheckbox from '../GTCheckbox'

interface CompleteButtonProps {
    isDone: boolean
    taskId: string
    sectionId?: string
    isSelected: boolean
}
const CompleteButton = ({ isDone, taskId, sectionId, isSelected }: CompleteButtonProps) => {
    const { mutate: markTaskDone } = useMarkTaskDone()
    const onMarkTaskDone = () =>
        markTaskDone({
            taskId: taskId,
            sectionId: sectionId,
            isDone: !isDone,
        })

    useKeyboardShortcut('markComplete', onMarkTaskDone, !isSelected)
    return <GTCheckbox isChecked={isDone} onChange={onMarkTaskDone} />
}

export default CompleteButton

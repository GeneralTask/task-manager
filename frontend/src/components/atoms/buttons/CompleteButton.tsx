import React from 'react'
import useKeyboardShortcut from '../../../hooks/useKeyboardShortcut'
import GTCheckbox from '../GTCheckbox'

interface CompleteButtonProps {
    isComplete: boolean
    onMarkComplete: (taskId: string, isComplete: boolean) => void
    taskId: string
    isSelected: boolean
}
const CompleteButton = ({ isComplete, onMarkComplete, taskId, isSelected }: CompleteButtonProps) => {
    useKeyboardShortcut('markComplete', () => onMarkComplete(taskId, !isComplete), !isSelected)
    return <GTCheckbox isChecked={isComplete} onChange={() => onMarkComplete(taskId, !isComplete)} />
}

export default CompleteButton

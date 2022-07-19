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
    const markComplete = () => onMarkComplete(taskId, !isComplete)
    useKeyboardShortcut('markComplete', markComplete, !isSelected)
    return <GTCheckbox isChecked={isComplete} onChange={markComplete} />
}

export default CompleteButton

import React from 'react'
import useKeyboardShortcut from '../../../hooks/useKeyboardShortcut'
import { useMarkTaskDone } from '../../../services/api-query-hooks'
import GTCheckbox from '../GTCheckbox'

interface CompleteButtonProps {
    isComplete: boolean
    taskId: string
    isSelected: boolean
}
const CompleteButton = (props: CompleteButtonProps) => {
    const { mutate: markTaskDone } = useMarkTaskDone()
    const handleClick = () => markTaskDone({ taskId: props.taskId, isCompleted: !props.isComplete })

    useKeyboardShortcut('markComplete', handleClick, !props.isSelected)
    return <GTCheckbox isChecked={props.isComplete} onChange={handleClick} />
}

export default CompleteButton

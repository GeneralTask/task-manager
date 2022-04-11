import useKeyboardShortcut from '../../../hooks/useKeyboardShortcut'
import { KEYBOARD_SHORTCUTS } from '../../../constants'
import React from 'react'
import { icons } from '../../../styles/images'
import { useMarkTaskDone } from '../../../services/api-query-hooks'
import NoStyleButton from './NoStyleButton'
import { Icon } from '../Icon'

interface CompleteButtonProps {
    isComplete: boolean
    taskId: string
    isSelected: boolean
}
const CompleteButton = (props: CompleteButtonProps) => {
    const { mutate: markTaskDone } = useMarkTaskDone()

    const onClickHandler = (e?: React.MouseEvent<HTMLButtonElement>) => {
        if (e) e.stopPropagation()
        markTaskDone({ taskId: props.taskId, isCompleted: !props.isComplete })
    }
    useKeyboardShortcut(KEYBOARD_SHORTCUTS.MARK_COMPLETE, onClickHandler, !props.isSelected)
    return (
        <NoStyleButton onClick={onClickHandler}>
            <Icon size="small" source={props.isComplete ? icons.task_complete : icons.task_incomplete} />
        </NoStyleButton>
    )
}

export default CompleteButton

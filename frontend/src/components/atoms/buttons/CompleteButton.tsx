import React from 'react'
import useKeyboardShortcut from '../../../hooks/useKeyboardShortcut'
import { useMarkTaskDone } from '../../../services/api-query-hooks'
import { icons } from '../../../styles/images'
import { Icon } from '../Icon'
import NoStyleButton from './NoStyleButton'

interface CompleteButtonProps {
    isComplete: boolean
    taskId: string
    sectionId: string
    isSelected: boolean
}
const CompleteButton = (props: CompleteButtonProps) => {
    const { mutate: markTaskDone } = useMarkTaskDone()

    const onClickHandler = (e?: React.MouseEvent<HTMLButtonElement>) => {
        if (e) e.stopPropagation()
        markTaskDone({ taskId: props.taskId, sectionId: props.sectionId, isCompleted: !props.isComplete })
    }
    useKeyboardShortcut('markComplete', onClickHandler, !props.isSelected)
    return (
        <NoStyleButton onClick={onClickHandler}>
            <Icon size="small" source={props.isComplete ? icons.task_complete : icons.task_incomplete} />
        </NoStyleButton>
    )
}

export default CompleteButton

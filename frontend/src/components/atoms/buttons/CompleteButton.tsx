import React from 'react'
import { KEYBOARD_SHORTCUTS } from '../../../constants'
import useKeyboardShortcut from '../../../hooks/useKeyboardShortcut'
import { useMarkTaskDone } from '../../../services/api-query-hooks'
import { icons } from '../../../styles/images'
import { Icon } from '../Icon'
import NoStyleButton from './NoStyleButton'
import useSound from 'use-sound'
import { sounds } from '../../../styles/sounds'

interface CompleteButtonProps {
    isComplete: boolean
    taskId: string
    isSelected: boolean
}
const CompleteButton = (props: CompleteButtonProps) => {
    const { mutate: markTaskDone } = useMarkTaskDone()

    const [playBoom] = useSound(sounds.boom)

    const onClickHandler = (e?: React.MouseEvent<HTMLButtonElement>) => {
        if (e) e.stopPropagation()
        playBoom()
        console.log('playing boom')
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

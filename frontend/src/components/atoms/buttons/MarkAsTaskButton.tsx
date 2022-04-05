import React from 'react'
import { useMarkMessageAsTask } from '../../../services/api-query-hooks'
import { icons } from '../../../styles/images'
import { Icon } from '../Icon'
import NoStyleButton from './NoStyleButton'

interface MarkAsTaskButtonProps {
    isTask: boolean
    messageId: string
}
const MarkAsTaskButton = (props: MarkAsTaskButtonProps) => {
    const { mutate: markAsTask } = useMarkMessageAsTask()

    const onClickHandler = () => {
        markAsTask({ id: props.messageId, isTask: !props.isTask })
    }
    return (
        <NoStyleButton onClick={onClickHandler}>
            <Icon size="small" source={props.isTask ? icons.mark_as_task_active : icons.mark_as_task} />
        </NoStyleButton>
    )
}

export default MarkAsTaskButton

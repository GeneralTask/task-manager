import { DateTime } from 'luxon'
import { TASK_PRIORITIES } from '../../../constants'
import { TSubtask } from '../../../utils/types'
import DueDate from '../../atoms/DueDate'
import { Icon } from '../../atoms/Icon'
import Checkbox from '../../shared_task/Checkbox'
import { RightContainer, SubtaskContainer, TitleSpan } from './Subtask'

interface SubtaskBodyInterface {
    subtask: TSubtask
    onClick?: () => void
}
const SubtaskBody = ({ subtask, onClick }: SubtaskBodyInterface) => {
    const dueDate = DateTime.fromISO(subtask.due_date)
    return (
        <SubtaskContainer onClick={onClick}>
            <Checkbox status={subtask.is_done ? 'complete' : 'in-progress'} />
            <TitleSpan isDone={subtask.is_done} shouldAnimate={false}>
                {subtask.title}
            </TitleSpan>
            <RightContainer>
                <DueDate date={dueDate} isDoneOrDeleted={subtask.is_done || subtask.is_deleted} />
                {subtask.priority_normalized !== 0 && (
                    <Icon
                        icon={TASK_PRIORITIES[subtask.priority_normalized].icon}
                        color={TASK_PRIORITIES[subtask.priority_normalized].color}
                    />
                )}
            </RightContainer>
        </SubtaskContainer>
    )
}

export default SubtaskBody

import { DateTime } from 'luxon'
import { TASK_PRIORITIES } from '../../../constants'
import { TSubtask } from '../../../utils/types'
import { emptyFunction } from '../../../utils/utils'
import DueDate from '../../atoms/DueDate'
import { Icon } from '../../atoms/Icon'
import MarkTaskDoneButton from '../../atoms/buttons/MarkTaskDoneButton'
import { RightContainer, SubtaskContainer, TitleSpan } from './Subtask'

interface SubtaskBodyInterface {
    subtask: TSubtask
}
const SubtaskBody = ({ subtask }: SubtaskBodyInterface) => {
    const dueDate = DateTime.fromISO(subtask.due_date)
    return (
        <SubtaskContainer>
            <MarkTaskDoneButton
                isDone={subtask.is_done}
                taskId={subtask.id}
                isSelected={false}
                onMarkComplete={emptyFunction}
                isDisabled
            />
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

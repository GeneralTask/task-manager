import { TASK_PRIORITIES } from '../../../constants'
import { Spacing } from '../../../styles'
import { icons } from '../../../styles/images'
import { TRecurringTaskTemplate } from '../../../utils/types'
import Flex from '../../atoms/Flex'
import { Icon } from '../../atoms/Icon'
import TaskTemplate from '../../atoms/TaskTemplate'
import { Truncated } from '../../atoms/typography/Typography'
import ItemContainer from '../ItemContainer'

interface RecurringTaskProps {
    recurringTask: TRecurringTaskTemplate
    isSelected: boolean
    onSelect: (recurringTask: TRecurringTaskTemplate) => void
}
const RecurringTask = ({ recurringTask, isSelected, onSelect }: RecurringTaskProps) => {
    return (
        <TaskTemplate>
            <ItemContainer isSelected={isSelected} onClick={() => onSelect(recurringTask)}>
                <Truncated>{recurringTask.title}</Truncated>
                <Flex gap={Spacing._12}>
                    {recurringTask.priority_normalized !== undefined && recurringTask.priority_normalized !== 0 && (
                        <Icon
                            icon={TASK_PRIORITIES[recurringTask.priority_normalized].icon}
                            color={TASK_PRIORITIES[recurringTask.priority_normalized].color}
                        />
                    )}
                    <Icon icon={icons.arrows_repeat} color="green" />
                </Flex>
            </ItemContainer>
        </TaskTemplate>
    )
}

export default RecurringTask

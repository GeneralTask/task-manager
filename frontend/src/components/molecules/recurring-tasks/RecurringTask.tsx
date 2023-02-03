import styled from 'styled-components'
import { TASK_PRIORITIES } from '../../../constants'
import { Colors, Spacing, Typography } from '../../../styles'
import { icons } from '../../../styles/images'
import { TRecurringTaskTemplate } from '../../../utils/types'
import Flex from '../../atoms/Flex'
import { Icon } from '../../atoms/Icon'
import TaskTemplate from '../../atoms/TaskTemplate'
import { Truncated } from '../../atoms/typography/Typography'
import ItemContainer from '../ItemContainer'

const Title = styled(Truncated)<{ deleted?: boolean }>`
    text-decoration: ${({ deleted }) => (deleted ? 'line-through' : 'none')};
    color: ${({ deleted }) => (deleted ? Colors.text.light : Colors.text.black)};
    ${Typography.bodySmall};
`

interface RecurringTaskProps {
    recurringTask: TRecurringTaskTemplate
    isSelected: boolean
    onSelect: (recurringTask: TRecurringTaskTemplate) => void
}
const RecurringTask = ({ recurringTask, isSelected, onSelect }: RecurringTaskProps) => {
    return (
        <TaskTemplate>
            <ItemContainer isSelected={isSelected} onClick={() => onSelect(recurringTask)}>
                <Title deleted={recurringTask.is_deleted}>{recurringTask.title}</Title>
                <Flex gap={Spacing._12}>
                    {recurringTask.priority_normalized !== undefined && recurringTask.priority_normalized !== 0 && (
                        <Icon
                            icon={TASK_PRIORITIES[recurringTask.priority_normalized].icon}
                            color={TASK_PRIORITIES[recurringTask.priority_normalized].color}
                        />
                    )}
                    <Icon icon={icons.arrows_repeat} />
                </Flex>
            </ItemContainer>
        </TaskTemplate>
    )
}

export default RecurringTask

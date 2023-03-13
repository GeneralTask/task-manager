import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../../styles'
import { icons } from '../../../styles/images'
import { TOverviewView } from '../../../utils/types'
import { Icon } from '../../atoms/Icon'
import { DeprecatedBold } from '../../atoms/typography/Typography'

const EmptyListMessageContainer = styled.div`
    display: flex;
    ${Typography.deprecated_label};
    color: ${Colors.text.light};
    align-items: center;
    gap: ${Spacing._12};
    justify-content: center;
`

const emptyListMessage = (list: TOverviewView) => {
    switch (list.type) {
        case 'task_section':
            return `Create new tasks to see them here.`
        case 'meeting_preparation':
            return 'Tasks will appear here when you have upcoming meetings.'
        case 'linear':
            return 'Issues assigned to you will appear here.'
        case 'github':
            return 'Your pull requests will appear here.'
        case 'slack':
            return 'Saved messages will appear here.'
        case 'due_today':
            return 'Tasks which are due today will appear here.'
        default:
            return ''
    }
}

interface EmptyListMessageProps {
    list: TOverviewView
}

const EmptyListMessage = ({ list }: EmptyListMessageProps) => {
    return (
        <EmptyListMessageContainer>
            <Icon icon={icons.check} color="gray" />
            <span>
                <DeprecatedBold>{list.name}</DeprecatedBold> is empty. {emptyListMessage(list)}
            </span>
        </EmptyListMessageContainer>
    )
}

export default EmptyListMessage

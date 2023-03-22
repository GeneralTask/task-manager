import styled from 'styled-components'
import { Border, Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { SharedTaskStatus } from '../../utils/types'
import { Icon } from '../atoms/Icon'

const StatusBadeContainer = styled.div<{ status: SharedTaskStatus }>`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    padding: ${Spacing._4} ${Spacing._8};
    width: fit-content;
    height: fit-content;
    border-radius: ${Border.radius.small};
    ${({ status }) =>
        `
        color: ${status == 'complete' ? Colors.background.white : Colors.text.title};
        background-color: ${status == 'complete' ? Colors.control.primary.bg : Colors.semantic.success.faint};
        `}
`

interface StatusBadgeProps {
    status: SharedTaskStatus
}

const StatusBadge = ({ status }: StatusBadgeProps) => {
    const icon = status === 'complete' ? icons.check : icons.play
    const iconColor = status === 'complete' ? 'white' : 'green'
    const text = status === 'complete' ? 'Complete' : 'In progress'

    return (
        <StatusBadeContainer status={status}>
            <Icon icon={icon} color={iconColor} />
            <span>{text}</span>
        </StatusBadeContainer>
    )
}

export default StatusBadge

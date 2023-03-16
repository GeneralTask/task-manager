import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { TTaskSharedAccess } from '../../utils/types'
import { Icon } from './Icon'

const Message = styled.div`
    ${Typography.label.medium};
    color: ${Colors.semantic.success.base};
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    pointer-events: none;
    user-select: none;
`

interface SharedItemMessageProps {
    shareAccess: TTaskSharedAccess
}
const SharedItemMessage = ({ shareAccess }: SharedItemMessageProps) => {
    return (
        <Message>
            <Icon icon={icons.link} color="green" />
            Shared with {shareAccess == 'public' ? 'everyone' : 'company'}
        </Message>
    )
}

export default SharedItemMessage

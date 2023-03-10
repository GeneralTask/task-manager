import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { TStatusColors } from '../../styles/colors'
import { colorToIcon } from '../../utils/sortAndFilter/pull-requests.config'
import { Icon } from '../atoms/Icon'
import Tip from '../radix/Tip'

const StatusContainer = styled.div<{ type: TStatusColors }>`
    display: flex;
    gap: ${Spacing._4};
    color: ${Colors.text.black};
    background: ${(props) => Colors.status[props.type].light};
    border: ${Border.stroke.medium} solid ${(props) => Colors.status[props.type].default};
    border-radius: ${Border.radius.medium};
    padding: ${Spacing._4} ${Spacing._8};
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: fit-content;
    ${Typography.deprecated_label};
    ${Typography.deprecated_bold};
`

interface StatusProps {
    description?: string
    status: string
    color: TStatusColors
}
const Status = ({ description = '', status, color }: StatusProps) => (
    <Tip content={description}>
        <StatusContainer type={color}>
            <Icon icon={colorToIcon[color]} color={color} />
            {status}
        </StatusContainer>
    </Tip>
)

export default Status

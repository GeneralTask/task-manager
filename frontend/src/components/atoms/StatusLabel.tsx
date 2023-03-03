import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { TStatusColors } from '../../styles/colors'
import { Icon, TIconType } from '../atoms/Icon'

const StatusLabelContainer = styled.div<{ type: TStatusColors }>`
    display: flex;
    gap: ${Spacing._4};
    color: ${(props) => Colors.status[props.type].default};
    background: ${(props) => Colors.status[props.type].light};
    border-radius: ${Border.radius.small};
    padding: ${Spacing._4} ${Spacing._8};
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: fit-content;
    ${Typography.deprecated_label};
    ${Typography.deprecated_bold};
`

interface StatusLabelProps {
    status: string
    color: TStatusColors
    icon?: TIconType
}
const StatusLabel = ({ status, color, icon }: StatusLabelProps) => (
    <StatusLabelContainer type={color}>
        {icon && <Icon icon={icon} color={color} />}
        {status}
    </StatusLabelContainer>
)

export default StatusLabel

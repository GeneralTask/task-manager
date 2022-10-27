import { useEffect } from 'react'
import ReactTooltip from 'react-tooltip'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { TStatusColors } from '../../styles/colors'
import { colorToIcon } from '../../utils/sortAndFilter/pull-requests.config'
import { Icon } from '../atoms/Icon'
import TooltipWrapper from '../atoms/TooltipWrapper'

const StatusContainer = styled.div<{ type: TStatusColors }>`
    display: flex;
    gap: ${Spacing._4};
    color: ${Colors.text.black};
    background: ${(props) => Colors.status[props.type].light};
    border: ${Border.stroke.medium} solid ${(props) => Colors.status[props.type].default};
    border-radius: ${Border.radius.small};
    padding: ${Spacing._4} ${Spacing._8};
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: fit-content;
    ${Typography.label};
    ${Typography.bold};
`

interface StatusProps {
    description?: string
    status: string
    color: TStatusColors
}
const Status = ({ description = '', status, color }: StatusProps) => {
    useEffect(() => {
        ReactTooltip.rebuild()
    }, [])
    return (
        <TooltipWrapper dataTip={description} tooltipId="tooltip">
            <StatusContainer type={color}>
                <Icon icon={colorToIcon[color]} color={color} />
                {status}
            </StatusContainer>
        </TooltipWrapper>
    )
}

export default Status

import styled from 'styled-components'
import { Border, Colors, Spacing } from '../../styles'
import { checkBig, icons } from '../../styles/images'
import { SharedTaskStatus } from '../../utils/types'
import { Icon } from '../atoms/Icon'

const CheckboxContainer = styled.div<{ status: SharedTaskStatus }>`
    padding: ${Spacing._2};
    border-radius: ${Border.radius.small};
    width: 16px;
    height: 16px;
    ${({ status }) =>
        `
    color: ${status == 'complete' ? Colors.background.white : Colors.text.title};
    background-color: ${status == 'complete' ? Colors.control.primary.bg : Colors.semantic.success.faint};
    `}
    display: flex;
    align-items: center;
    justify-content: center;
`

interface CheckboxProps {
    status: SharedTaskStatus
}

const Checkbox = ({ status }: CheckboxProps) => {
    const icon = status === 'complete' ? checkBig : icons.play
    const iconColor = status === 'complete' ? 'white' : 'green'
    return (
        <CheckboxContainer status={status}>
            <Icon icon={icon} color={iconColor} size="small" />
        </CheckboxContainer>
    )
}

export default Checkbox

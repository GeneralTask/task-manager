import styled from 'styled-components'
import { Border, Colors, Spacing } from '../../styles'
import { TIconImage, icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'

const ButtonContainer = styled.div`
    display: flex;
    align-items: center;
    padding: ${Spacing._12} ${Spacing._8};
    gap: ${Spacing._8};
    cursor: pointer;
    user-select: none;
    width: 100%;
    box-sizing: border-box;
    background-color: ${Colors.background.medium};
    border-radius: ${Border.radius.mini};
`
const PositionedIcon = styled(Icon)`
    margin-left: auto;
`

interface DropdownButtonProps {
    icon: TIconImage
    iconColorHex?: string
    label: string
}
const DropdownButton = ({ icon, iconColorHex, label }: DropdownButtonProps) => {
    return (
        <ButtonContainer>
            <Icon icon={icons[icon]} colorHex={iconColorHex} />
            {label}
            <PositionedIcon icon={icons.caret_down_solid} />
        </ButtonContainer>
    )
}

export default DropdownButton

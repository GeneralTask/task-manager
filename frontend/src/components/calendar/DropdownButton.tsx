import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
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
`
const PositionedIcon = styled(Icon)`
    margin-left: auto;
`

interface DropdownButtonProps {
    label: string
}
const DropdownButton = ({ label }: DropdownButtonProps) => {
    return (
        <ButtonContainer>
            <Icon icon={icons.folder} />
            {label}
            <PositionedIcon icon={icons.caret_down_solid} />
        </ButtonContainer>
    )
}

export default DropdownButton

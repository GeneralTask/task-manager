import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { TIconType } from '../atoms/Icon'
import TooltipWrapper from '../atoms/TooltipWrapper'
import GTIconButton from '../atoms/buttons/GTIconButton'

const DropdownContainer = styled.div`
    display: flex;
    align-items: center;
    padding: ${Spacing._16} 0 ${Spacing._4};
`
const Title = styled.span`
    color: ${Colors.text.black};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    user-select: none;
    ${Typography.eyebrow};
`

interface NavigationHeaderProps {
    title: string
    tooltip: string
    icon?: TIconType
    onClick?: () => void
    renderButton?: () => JSX.Element // Override
}
const NavigationHeader = ({ title, icon, tooltip, onClick, renderButton }: NavigationHeaderProps) => {
    const handleOnClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation()
        if (!onClick) return
        onClick()
    }

    return (
        <>
            <DropdownContainer>
                <Title>{title}</Title>
                {(onClick || renderButton) && (
                    <TooltipWrapper dataTip={tooltip} tooltipId="tooltip">
                        {renderButton ? (
                            renderButton()
                        ) : (
                            <GTIconButton icon={icon ?? icons.x} onClick={handleOnClick} />
                        )}
                    </TooltipWrapper>
                )}
            </DropdownContainer>
        </>
    )
}

export default NavigationHeader

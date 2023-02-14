import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import styled from 'styled-components'
import { Colors, Dimensions } from '../../styles'
import { TIconColor } from '../../styles/colors'
import { TIconSize } from '../../styles/dimensions'
import Flex from './Flex'

export type TIconType = IconProp | string

const IconContainer = styled.div<{ size: string }>`
    width: ${({ size }) => size};
    height: ${({ size }) => size};
    font-size: ${({ size }) => size};
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    flex-shrink: 0;
`
const ImageContainer = styled.img`
    width: 100%;
    aspect-ratio: 1;
`
const StyledFontAwesomeIcon = styled(FontAwesomeIcon)<{ height: string; hidden?: boolean }>`
    height: ${({ height }) => height};
    visibility: ${({ hidden }) => (hidden ? 'hidden' : 'visible')};
    aspect-ratio: 1;
`
interface IconProps {
    icon: TIconType
    size?: TIconSize
    color?: TIconColor // should take priority over colorHex
    colorHex?: string
    className?: string
    hidden?: boolean
}
export const Icon = ({ icon, size = 'default', color, colorHex, className, hidden }: IconProps) => {
    const dimension = Dimensions.iconSize[size]
    // priority is color -> colorHex -> black
    const iconColor = color ? Colors.icon[color] : colorHex ?? Colors.icon.black

    if (typeof icon === 'string')
        return (
            <IconContainer size={dimension} className={className}>
                {!hidden && <ImageContainer src={icon} />}
            </IconContainer>
        )
    return (
        <Flex>
            <StyledFontAwesomeIcon
                icon={icon}
                color={iconColor}
                className={className}
                height={dimension}
                hidden={hidden}
            />
        </Flex>
    )
}

import { IconProp } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import styled from 'styled-components'
import { Colors, Dimensions } from '../../styles'
import { TIconColor } from '../../styles/colors'
import { TIconSize } from '../../styles/dimensions'

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
interface IconProps {
    icon: TIconType
    size?: TIconSize
    color?: TIconColor
    className?: string
}
export const Icon = ({ icon, size = 'default', color = 'black', className }: IconProps) => {
    const dimension = Dimensions.iconSize[size]

    return (
        <IconContainer size={dimension} className={className}>
            {typeof icon === 'string' ? (
                <ImageContainer src={icon} />
            ) : (
                <FontAwesomeIcon icon={icon} color={Colors.icon[color]} />
            )}
        </IconContainer>
    )
}

import { Colors, Dimensions } from '../../styles'
import { TIconSize } from '../../styles/dimensions'
import React from 'react'
import styled from 'styled-components'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { IconProp } from '@fortawesome/fontawesome-svg-core'

const IconContainer = styled.div<{ width: string; height: string }>`
    width: ${(props) => props.width};
    height: ${(props) => props.height};
    font-size: ${(props) => props.height};
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
`
const ImageContainer = styled.img`
    width: 100%;
    aspect-ratio: 1;
`
interface IconProps {
    icon: IconProp | string
    size: TIconSize
    color?: string
}
export const Icon = (props: IconProps) => {
    const dimension = Dimensions.iconSize[props.size]
    const iconColor = props.color ? props.color : Colors.icon.gray

    return (
        <IconContainer width={dimension} height={dimension}>
            {typeof props.icon === 'string' ? (
                <ImageContainer src={props.icon} />
            ) : (
                <FontAwesomeIcon icon={props.icon} color={iconColor} />
            )}
        </IconContainer>
    )
}

import { Dimensions, Images } from '../../styles'

import React from 'react'
import { TIconSize } from '../../styles/dimensions'
import styled from 'styled-components'

const IconContainer = styled.div<{ width: string; height: string }>`
    width: ${(props) => props.width};
    height: ${(props) => props.height};
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    position: relative;
`
const ImageContainer = styled.img<{ xOffset?: string; yOffset?: string }>`
    width: 100%;
    aspect-ratio: 1;
    position: absolute;
    ${({ xOffset }) => xOffset && `left: ${xOffset};`}
    ${({ yOffset }) => yOffset && `top: ${yOffset};`}
`

interface IconProps {
    size: TIconSize
    uri?: string
    source?: string
    xOffset?: string
    yOffset?: string
}
export const Icon = (props: IconProps) => {
    const image = props.uri != undefined ? props.uri : props.source ? props.source : Images.logos.generaltask

    const dimension = Dimensions.iconSize[props.size]

    return (
        <IconContainer width={dimension} height={dimension}>
            <ImageContainer src={image} xOffset={props.xOffset} yOffset={props.yOffset} />
        </IconContainer>
    )
}

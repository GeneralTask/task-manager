import { Dimensions, Images } from '../../styles'
import { TIconSize } from '../../styles/dimensions'
import React from 'react'
import styled from 'styled-components'

const IconContainer = styled.div<{ width: string; height: string }>`
    width: ${(props) => props.width};
    height: ${(props) => props.height};
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
    size: TIconSize
    uri?: string
    source?: string
}
export const Icon = (props: IconProps) => {
    const image = props.uri != undefined ? props.uri : props.source ? props.source : Images.logos.generaltask

    const dimension = Dimensions.iconSize[props.size]

    return (
        <IconContainer width={dimension} height={dimension}>
            <ImageContainer src={image} />
        </IconContainer>
    )
}

/* eslint @typescript-eslint/no-var-requires: "off" */
import React from 'react'
import styled from 'styled-components'
import { Dimensions } from '../../styles'

const IconContainer = styled.div<{ width: number; height: number }>`
    width: ${(props) => props.width}px;
    height: ${(props) => props.height}px;
    align-items: center;
    justify-content: center;
`
const ImageContainer = styled.img`
    width: 100%;
    aspect-ratio: 1;
`

interface IconProps {
    size: 'xxSmall' | 'xSmall' | 'small' | 'medium' | 'large'
    uri?: string
    source?: NodeRequire
}
export const Icon = (props: IconProps) => {
    let image = require('../../assets/generaltask.png')
    if (props.source) image = props.source
    if (props.uri) image = { uri: props.uri }

    const dimension = (() => {
        switch (props.size) {
            case 'xxSmall':
                return Dimensions.iconSize.xxSmall
            case 'xSmall':
                return Dimensions.iconSize.xSmall
            case 'small':
                return Dimensions.iconSize.small
            case 'medium':
                return Dimensions.iconSize.medium
            case 'large':
                return Dimensions.iconSize.large
        }
    })()

    return (
        <IconContainer width={dimension} height={dimension}>
            <ImageContainer src={image} />
        </IconContainer>
    )
}

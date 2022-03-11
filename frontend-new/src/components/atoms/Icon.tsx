/* eslint @typescript-eslint/no-var-requires: "off" */
import React from 'react'
import { Image, ImageSourcePropType, StyleSheet } from 'react-native'
import styled from 'styled-components/native'
import { Dimensions, Flex } from '../../styles'

const IconContainer = styled.View<{ width: number, height: number }>`
    width: ${props => props.width}px;
    height: ${props => props.height}px;
    align-items: center;
    justify-content: center;
`

interface IconProps {
    size: 'xSmall' | 'small' | 'medium' | 'large'
    uri?: string
    source?: NodeRequire | ImageSourcePropType
}
export const Icon = (props: IconProps) => {
    let image = require('../../assets/generaltask.png')
    if (props.source) image = props.source
    if (props.uri) image = { uri: props.uri }

    const dimension = (() => {
        switch (props.size) {
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
            <Image style={styles.icon} source={image} />
        </IconContainer>
    )
}

const styles = StyleSheet.create({
    iconContainer: {
        width: 20,
        height: 20,
        ...Flex.column,
        alignItems: 'center',
        justifyContent: 'center',
    },
    icon: {
        width: '100%',
        height: undefined,
        aspectRatio: 1,
    },
})

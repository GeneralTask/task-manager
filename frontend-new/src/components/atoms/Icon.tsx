/* eslint @typescript-eslint/no-var-requires: "off" */
import React from 'react'
import { Image, StyleSheet } from 'react-native'
import styled from 'styled-components/native'
import { Dimensions, Flex } from '../../styles'

const IconContainer = styled.View<{ width: number, height: number }>`
    width: ${props => props.width};
    height: ${props => props.height};
    align-items: center;
    justify-content: center;
`

interface IconProps {
    size: 'xSmall' | 'small' | 'medium' | 'large'
    uri?: string
    source?: NodeRequire
}
export const Icon = (props: IconProps) => {
    let image = require('../../assets/generaltask.png')
    if (props.source) image = props.source
    if (props.uri) image = { uri: props.uri }

    const dimension =
        props.size === 'xSmall' ? Dimensions.iconSize.xSmall :
            'small' ? Dimensions.iconSize.small :
                props.size === 'medium' ? Dimensions.iconSize.medium :
                    Dimensions.iconSize.large

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

/* eslint @typescript-eslint/no-var-requires: "off" */
import React from 'react'
import { Image, ImageSourcePropType, StyleSheet } from 'react-native'
import styled from 'styled-components/native'
import { Dimensions, Flex } from '../../styles'
import { logos } from '../../styles/images'

const IconContainer = styled.View<{ width: number, height: number }>`
    width: ${props => props.width};
    height: ${props => props.height};
    align-items: center;
    justify-content: center;
`

interface IconProps {
    size: 'small' | 'medium' | 'large'
    source?: ImageSourcePropType
}
export const Icon = (props: IconProps) => {
    const image = props.source ?? logos.generaltask
    const dimension =
        props.size === 'small' ? Dimensions.iconSize.small :
            props.size === 'medium' ? Dimensions.iconSize.medium : Dimensions.iconSize.large

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

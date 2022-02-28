import React from 'react'
import { View, Image, StyleSheet, ViewStyle } from 'react-native'
import { Dimensions, Flex } from '../../styles'

interface IconProps {
    style?: ViewStyle
}
export const Icon = (props: IconProps) => {
    return (
        <View style={[props.style, styles.iconContainer]}>
            <Image style={styles.icon} source={require('../../assets/generaltask.png')} />
        </View>
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
        aspectRatio: Dimensions.iconRatio,
    },
})

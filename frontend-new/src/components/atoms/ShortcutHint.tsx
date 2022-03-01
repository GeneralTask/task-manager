import React from 'react'
import { View, Text, StyleSheet, Platform, ViewStyle } from 'react-native'
import { Colors, Typography } from '../../styles'

interface ShotcutHintProps {
    character: string,
    style: ViewStyle,
}
const ShotcutHint = (props: ShotcutHintProps) => {
    return (
        <View style={[styles.container, props.style]}>
            <Text style={styles.character}>{props.character}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 5,
        padding: 0,
        textAlign: 'center',
        backgroundColor: Colors.white,
        width: 20,
        height: 20,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',

    },
    character: {
        ...Platform.select({
            ios: {},
            default: {
                ...Typography.xSmall,
                color: Colors.gray._600,
            }
        })
    }
})

export default ShotcutHint

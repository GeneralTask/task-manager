import React from 'react'
import { Text, StyleSheet, TextStyle } from 'react-native'
import { Colors, Typography } from '../../../styles'

interface GraySubtitleProps {
    children: string,
    style?: TextStyle
}

export const GraySubtitle = (props: GraySubtitleProps) => {
    return <Text style={[styles.subtitle, props.style]}>{props.children}</Text>
}

const styles = StyleSheet.create({
    subtitle: {
        ...Typography.xxSmall,
        ...Typography.weight._600,
        color: Colors.gray._400,
    }
})

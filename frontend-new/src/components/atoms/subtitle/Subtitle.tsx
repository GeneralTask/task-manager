import React from 'react'
import { Text, StyleSheet, TextStyle } from 'react-native'
import { Colors, Typography } from '../../../styles'

interface SubtitleProps {
    children: string,
    style?: TextStyle
}
export const Subtitle = ({ children, style }: SubtitleProps) => {
    return (
        <Text style={[styles.subtitle, style]}>{children}</Text>
    )
}

const styles = StyleSheet.create({
    subtitle: {
        ...Typography.small,
        ...Typography.weight._400,
        color: Colors.gray._600,
    }
})

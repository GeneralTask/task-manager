import React from 'react'
import { Text, StyleSheet, TextStyle } from 'react-native'
import { Colors, Typography } from '../../../styles'

interface TitleProps {
    children: string
    style?: TextStyle
}
export const Title = ({ children, style }: TitleProps) => {
    return (
        <Text style={[styles.title, style]}>{children}</Text>
    )
}

const styles = StyleSheet.create({
    title: {
        ...Typography.medium,
        ...Typography.weight._600,
        color: Colors.gray._700,
    }
})

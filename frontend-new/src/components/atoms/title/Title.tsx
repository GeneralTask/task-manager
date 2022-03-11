import React from 'react'
import { Text, StyleSheet, TextStyle } from 'react-native'
import styled from 'styled-components/native'
import { Colors, Typography } from '../../../styles'

const TitleSmallStyle = styled.Text`
    color: ${Colors.gray._500};
    font-weight: ${Typography.weight._600.fontWeight};
    font-size: ${Typography.small.fontSize}px;

`

interface TitleProps {
    children: string
    style?: TextStyle
}
export const Title = ({ children, style }: TitleProps) => {
    return (
        <Text style={[styles.title, style]}>{children}</Text>
    )
}
export const TitleSmall = ({ children }: TitleProps) => {
    return (
        <TitleSmallStyle>{children}</TitleSmallStyle>
    )
}

const styles = StyleSheet.create({
    title: {
        ...Typography.medium,
        ...Typography.weight._600,
        color: Colors.gray._700,
    }
})

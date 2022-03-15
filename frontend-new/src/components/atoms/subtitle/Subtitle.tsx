import React from 'react'
import { Text, StyleSheet, TextStyle } from 'react-native'
import styled from 'styled-components/native'
import { Colors, Typography } from '../../../styles'

const SubtitleSmallStyles = styled.Text`
    color: ${Colors.gray._500};
    font-size: ${Typography.xxSmall.fontSize}px;
    font-weight: ${Typography.weight._400.fontWeight};
`

interface SubtitleProps {
    children: string
    style?: TextStyle
}
export const Subtitle = ({ children, style }: SubtitleProps) => {
    return <Text style={[styles.subtitle, style]}>{children}</Text>
}

export const SubtitleSmall = ({ children }: SubtitleProps) => {
    return <SubtitleSmallStyles>{children}</SubtitleSmallStyles>
}

const styles = StyleSheet.create({
    subtitle: {
        ...Typography.small,
        ...Typography.weight._400,
        color: Colors.gray._600,
    },
})

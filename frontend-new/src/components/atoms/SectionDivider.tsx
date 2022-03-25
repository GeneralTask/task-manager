import React from 'react'
import styled from 'styled-components/native'
import { Colors } from '../../styles'

const DividerView = styled.View<{ color: string }>`
    height: 1;
    width: 100%;
    background-color: ${props => props.color};
`
interface DividerProps {
    color?: string
}
export const Divider = ({ color }: DividerProps) => {
    const backgroundColor = color ?? Colors.gray._100
    console.log(backgroundColor)
    return <DividerView color={backgroundColor} />
}

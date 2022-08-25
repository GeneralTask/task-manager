import React from 'react'
import styled from 'styled-components'
import { Border, Colors } from '../../styles'

const DividerView = styled.div<{ color: string }>`
    height: ${Border.stroke.medium};
    width: 100%;
    flex-shrink: 0;
    background-color: ${(props) => props.color};
`
interface DividerProps {
    color?: string
}
export const Divider = ({ color }: DividerProps) => {
    const backgroundColor = color ?? Colors.border.gray
    return <DividerView color={backgroundColor} />
}

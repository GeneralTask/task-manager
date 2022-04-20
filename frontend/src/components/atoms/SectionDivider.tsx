import React from 'react'
import styled from 'styled-components'
import { Colors } from '../../styles'

const DividerView = styled.div<{ color: string }>`
    height: 1px;
    width: 100%;
    background-color: ${(props) => props.color};
`
interface DividerProps {
    color?: string
}
const Divider = ({ color }: DividerProps) => {
    const backgroundColor = color ?? Colors.gray._100
    return <DividerView color={backgroundColor} />
}

export default Divider

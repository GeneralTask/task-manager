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
    className?: string
}
export const Divider = ({ color, className }: DividerProps) => {
    const backgroundColor = color ?? Colors.background.border
    return <DividerView color={backgroundColor} className={className} />
}

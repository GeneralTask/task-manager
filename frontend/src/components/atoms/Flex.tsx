import styled from 'styled-components'

/*
    This is a common Flex container intended to reduce the number of styled components we write just for flex properties.
    We can add more properties for common use cases, including with variable values (i.e. gap).
*/

interface FlexProps {
    flex?: '0' | '1'
    gap?: string
    column?: boolean
    justifyContent?: 'baseline' | 'center' | 'space-between' | 'end'
    alignItems?: 'baseline' | 'center' | 'flex-end' | 'flex-start'
}

const Flex = styled.div<FlexProps>`
    display: flex;
    ${({ flex }) => flex && `flex: ${flex};`}
    ${({ column }) => column && 'flex-direction: column;'}
    ${({ gap }) => gap && `gap: ${gap};`}
    ${({ justifyContent }) => justifyContent && `justify-content: ${justifyContent};`}
    ${({ alignItems }) => alignItems && `align-items: ${alignItems};`}
`

export default Flex

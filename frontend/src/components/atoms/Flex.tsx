import styled from 'styled-components'

/*
    This is a common Flex container intended to reduce the number of styled components we write just for flex properties.
    We can add more properties for common use cases, including with variable values (i.e. gap).
*/

interface FlexProps {
    gap?: string
    column?: boolean
    // justifyContentCenter?: boolean
    // justifyContentSpaceBetween?: boolean
    justifyContent?: 'baseline' | 'center' | 'space-between'
    alignItems?: 'baseline' | 'center' | 'flex-end' | 'flex-start'
    // alignItemsCenter?: boolean
}

export const Flex = styled.div<FlexProps>`
    display: flex;
    flex: 1;
    ${({ column }) => column && 'flex-direction: column;'}
    ${({ gap }) => gap && `gap: ${gap};`}
    ${({ justifyContent }) => justifyContent && `justify-content: ${justifyContent};`}
    ${({ alignItems }) => alignItems && `align-items: ${alignItems}`}
`
export const FlexBox = styled.div<FlexProps>`
    display: flex;
    ${({ column }) => column && 'flex-direction: column;'}
    ${({ gap }) => gap && `gap: ${gap};`}
    ${({ justifyContent }) => justifyContent && `justify-content: ${justifyContent};`}
    ${({ alignItems }) => alignItems && `align-items: ${alignItems}`}
`

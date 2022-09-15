import styled from 'styled-components'

/*
    This is a common Flex container intended to reduce the number of styled components we write just for flex properties.
    We can add more properties for common use cases, including with variable values (i.e. gap).
*/

interface FlexProps {
    gap?: string
    justifyContentCenter?: boolean
    justifyContentSpaceBetween?: boolean
    alignItemsCenter?: boolean
}

const Flex = styled.div<FlexProps>`
    display: flex;
    flex: 1;
    ${(props) => props.gap && 'gap: ' + props.gap};
    ${({ justifyContentCenter }) => justifyContentCenter && 'justify-content: center;'}
    ${({ justifyContentSpaceBetween }) => justifyContentSpaceBetween && 'justify-content: space-between;'}
    ${({ alignItemsCenter }) => alignItemsCenter && 'align-items: center;'}
`

export default Flex

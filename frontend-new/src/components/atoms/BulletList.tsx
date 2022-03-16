import React from 'react'
import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'

const StyledUl = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
    color: ${Colors.gray._600};
`
const StyledLI = styled.li`
    &:before {
        content: '•';
        margin-right: ${Spacing.margin.small}px;
    }
    margin-bottom: ${Spacing.margin.medium}px;
`
interface BulletListProps {
    bullets: string[]
}
const BulletList = ({ bullets }: BulletListProps) => {
    return (
        <StyledUl>
            {bullets.map((bullet, index) => (
                <StyledLI key={index}>{bullet}</StyledLI>
            ))}
        </StyledUl>
    )
}

export default BulletList

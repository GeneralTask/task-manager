import { forwardRef, memo } from 'react'
import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'

const DominoContainer = styled.div<{ isVisible: boolean }>`
    height: ${Spacing._16};
    width: 10px;
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    opacity: ${({ isVisible }) => (isVisible ? '1' : '0')};
`
const Dot = styled.div`
    width: 3px;
    height: 3px;
    border-radius: 50px;
    background-color: ${Colors.border.gray};
    margin: 1px;
`

interface DominoProps {
    isVisible?: boolean
    className?: string
}
const Domino = forwardRef<HTMLDivElement, DominoProps>(({ isVisible = true, className }, ref) => {
    return (
        <DominoContainer ref={ref} isVisible={isVisible} className={className}>
            {Array(6)
                .fill(0)
                .map((_, i) => (
                    <Dot key={i} />
                ))}
        </DominoContainer>
    )
})

export default memo(Domino)

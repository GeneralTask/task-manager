import { forwardRef, memo } from 'react'
import styled from 'styled-components'
import { icons } from '../../styles/images'
import { Icon } from './Icon'

const DominoContainer = styled.div<{ isVisible: boolean }>`
    opacity: ${({ isVisible }) => (isVisible ? '1' : '0')};
`
interface DominoProps {
    isVisible?: boolean
    className?: string
}
const Domino = forwardRef<HTMLDivElement, DominoProps>(({ isVisible = true, className }, ref) => {
    return (
        <DominoContainer isVisible={isVisible} className={className} ref={ref}>
            <Icon icon={icons.domino} color="gray" />
        </DominoContainer>
    )
})

export default memo(Domino)

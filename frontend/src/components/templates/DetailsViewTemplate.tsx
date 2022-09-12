import { useRef } from 'react'
import styled from 'styled-components'
import useDetailsViewDrop from '../../hooks/useDetailsViewDrop'
import { Colors, Spacing } from '../../styles'

const DetailsViewContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: ${Colors.background.light};
    min-width: 300px;
    padding: ${Spacing._32} ${Spacing._16} ${Spacing._16};
    gap: ${Spacing._8};
`

const DetailsViewTemplate = ({ children }: { children: React.ReactNode }) => {
    const detailsViewContainerRef = useRef<HTMLDivElement>(null)
    useDetailsViewDrop(detailsViewContainerRef)

    return <DetailsViewContainer ref={detailsViewContainerRef}>{children}</DetailsViewContainer>
}

export default DetailsViewTemplate

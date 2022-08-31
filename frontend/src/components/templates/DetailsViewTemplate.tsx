import React, { useRef } from 'react'
import styled from 'styled-components'
import useDetailsViewDrop from '../../hooks/useDetailsViewDrop'
import { Colors, Spacing } from '../../styles'

const DetailsViewContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: ${Colors.background.light};
    min-width: 300px;
    padding: ${Spacing.padding._40} ${Spacing.padding._16} ${Spacing.padding._16};
`

const DetailsViewTemplate = ({ children }: { children: React.ReactNode }) => {
    const detailsViewContainerRef = useRef<HTMLDivElement>(null)
    useDetailsViewDrop(detailsViewContainerRef)

    return <DetailsViewContainer ref={detailsViewContainerRef}>{children}</DetailsViewContainer>
}

export default DetailsViewTemplate

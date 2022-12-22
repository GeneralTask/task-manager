import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'

const DetailsViewContainer = styled.div`
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: ${Colors.background.white};
    min-width: 300px;
    padding: ${Spacing._32} ${Spacing._16} ${Spacing._16};
    gap: ${Spacing._8};
    overflow: auto;
`

const DetailsViewTemplate = ({ children }: { children: React.ReactNode }) => {
    return <DetailsViewContainer>{children}</DetailsViewContainer>
}

export default DetailsViewTemplate

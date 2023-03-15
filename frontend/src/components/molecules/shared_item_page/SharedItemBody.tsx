import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../../styles'
import { Divider } from '../../atoms/SectionDivider'

const SharedItemBody = styled.div`
    margin-top: 110px;
    background: ${Colors.background.white};
    border-radius: ${Border.radius.medium};
    box-shadow: ${Shadows.deprecated_medium};
    gap: ${Spacing._24};
    margin: ${Spacing._24};
`

const PaddedContainerContent = styled.div`
    padding: ${Spacing._24};
`
const PaddedContainerFooter = styled.div`
    padding: ${Spacing._16} ${Spacing._24};
`

interface SharedItemBodyContainerProps {
    content: React.ReactNode
    footer?: React.ReactNode
}

const SharedItemBodyContainer = ({ content, footer }: SharedItemBodyContainerProps) => {
    return (
        <SharedItemBody>
            <PaddedContainerContent>{content}</PaddedContainerContent>
            {footer && (
                <>
                    <Divider />
                    <PaddedContainerFooter>{footer}</PaddedContainerFooter>
                </>
            )}
        </SharedItemBody>
    )
}

export default SharedItemBodyContainer

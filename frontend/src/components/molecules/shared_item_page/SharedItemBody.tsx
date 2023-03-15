import { Divider } from '@mantine/core'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../../styles'

const SharedItemBody = styled.div`
    margin-top: 110px;
    background: ${Colors.background.white};
    border-radius: ${Border.radius.medium};
    box-shadow: ${Shadows.deprecated_medium};
    gap: ${Spacing._24};
    margin: ${Spacing._24};
`

const PaddedContainer = styled.div`
    padding: ${Spacing._24};
`

interface SharedItemBodyContainerProps {
    content: React.ReactNode
    footer?: React.ReactNode
}

const SharedItemBodyContainer = ({ content, footer }: SharedItemBodyContainerProps) => {
    return (
        <SharedItemBody>
            <PaddedContainer>{content}</PaddedContainer>
            {footer && (
                <>
                    <Divider />
                    <PaddedContainer>{footer}</PaddedContainer>
                </>
            )}
        </SharedItemBody>
    )
}

export default SharedItemBodyContainer

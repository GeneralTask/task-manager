import React from 'react'
import styled from 'styled-components'
import { Colors, Spacing } from '../../styles'

const FlexColumn = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
`
const NumMessagesContainer = styled.div`
    position: fixed;
    line-height: 0;
    padding: ${Spacing.padding._16}px;
    background: ${Colors.gray._50};
`
const Divider = styled.hr`
    border: 1px solid ${Colors.gray._200};
    margin: ${Spacing.margin._8}px 0 ${Spacing.margin._4}px 0;
    width: 100%;
`

interface PreviousMessagesProps {
    numMessages: number
}

const PreviousMessages = (props: PreviousMessagesProps) => {
    return (
        <FlexColumn>
            <Divider />
            <Divider />
            <NumMessagesContainer>{`View ${props.numMessages} Previous Messages`}</NumMessagesContainer>
            <Divider />
            <Divider />
        </FlexColumn>
    )
}

export default PreviousMessages

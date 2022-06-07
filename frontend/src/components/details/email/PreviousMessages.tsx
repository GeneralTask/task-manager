import React from 'react'
import styled from 'styled-components'
import { Colors, Spacing } from '../../../styles'

const FlexColumn = styled.div`
    display: flex;
    position: relative;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
`
const NumMessagesContainer = styled.div`
    position: absolute;
    line-height: 0;
    padding: ${Spacing.padding._16};
    background: ${Colors.gray._50};
`
const Divider = styled.hr`
    border: 1px solid ${Colors.gray._200};
    margin: ${Spacing.margin._8} 0 ${Spacing.margin._4} 0;
    width: 100%;
`

interface PreviousMessagesProps {
    numMessages: number
    onClick: () => void
}

const PreviousMessages = (props: PreviousMessagesProps) => {
    return (
        <FlexColumn onClick={props.onClick}>
            <Divider />
            <Divider />
            <NumMessagesContainer>{`View ${props.numMessages} Previous Messages`}</NumMessagesContainer>
            <Divider />
            <Divider />
        </FlexColumn>
    )
}

export default PreviousMessages

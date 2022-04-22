import { Colors, Spacing, Typography } from '../../styles'
import styled from 'styled-components'
import React, { useEffect, useState } from 'react'
import SanitizedHTML from '../atoms/SanitizedHTML'
import { removeHTMLTags } from '../../utils/utils'
import { TRecipients, TSender } from '../../utils/types'
import EmailSenderDetails from '../molecules/EmailSenderDetails'
import ReactTooltip from 'react-tooltip'

const DetailsViewContainer = styled.div`
    display: flex;
    flex-direction: column;
    background-color: ${Colors.gray._50};
    border-bottom: 1px solid ${Colors.gray._200};
`
const CollapseExpandContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0;
    cursor: pointer;
`
const SenderContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: ${Spacing.padding._4}px ${Spacing.padding._8}px;
    height: 50px;
`
const SentAtContainer = styled.div`
    margin-left: auto;
`
const BodyContainer = styled.div`
    flex: 1;
`
const BodyContainerCollapsed = styled.span`
    flex: 1;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    min-width: 0;
    color: ${Colors.gray._400};
`

const Title = styled.div`
    background-color: inherit;
    color: ${Colors.gray._600};
    font: inherit;
    font-size: ${Typography.xSmall.fontSize};
    font-weight: ${Typography.weight._600};
    overflow: hidden;
    display: flex;
    flex: 1;
`
interface DetailsTemplateProps {
    sender: TSender
    recipients: TRecipients
    time_sent: string
    body: string
    isCollapsed: boolean
}

const EmailTemplate = (props: DetailsTemplateProps) => {
    const [isCollapsed, setIsCollapsed] = useState(!!props.isCollapsed)

    useEffect(() => setIsCollapsed(!!props.isCollapsed), [props.isCollapsed])
    useEffect(() => {
        ReactTooltip.rebuild()
    }, [])

    return (
        <DetailsViewContainer>
            <CollapseExpandContainer onClick={() => setIsCollapsed(!isCollapsed)}>
                <SenderContainer>
                    <div>
                        <Title>{props.sender.name}</Title>
                        <EmailSenderDetails sender={props.sender} recipients={props.recipients} />
                    </div>
                    <SentAtContainer>{props.time_sent}</SentAtContainer>
                </SenderContainer>
                {isCollapsed && <BodyContainerCollapsed>{removeHTMLTags(props.body)}</BodyContainerCollapsed>}
            </CollapseExpandContainer>
            {isCollapsed || (
                <BodyContainer>
                    <SanitizedHTML dirtyHTML={props.body} />
                </BodyContainer>
            )}
        </DetailsViewContainer>
    )
}

export default EmailTemplate

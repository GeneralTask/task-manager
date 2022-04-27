import { Colors, Typography } from '../../styles'
import styled from 'styled-components'
import React, { useEffect, useState } from 'react'
import SanitizedHTML from '../atoms/SanitizedHTML'
import { removeHTMLTags } from '../../utils/utils'
import { EmailComposeType } from '../../utils/enums'
import { TEmailComposeState } from '../../utils/types'

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
    height: 50px;
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
interface EmailTemplateProps {
    sender: string
    time_sent?: string
    body: string
    isCollapsed: boolean
    composeType: EmailComposeType | null // null if not in compose mode, otherwise the compose type
    setThreadComposeState: (state: TEmailComposeState) => void
}

const EmailTemplate = (props: EmailTemplateProps) => {
    const [isCollapsed, setIsCollapsed] = useState(!!props.isCollapsed)

    useEffect(() => setIsCollapsed(!!props.isCollapsed), [props.isCollapsed])

    return (
        <DetailsViewContainer>
            <CollapseExpandContainer onClick={() => setIsCollapsed(!isCollapsed)}>
                <SenderContainer>
                    <Title>{props.sender}</Title>
                    {props.time_sent}
                </SenderContainer>
                {isCollapsed && <BodyContainerCollapsed>{removeHTMLTags(props.body)}</BodyContainerCollapsed>}
            </CollapseExpandContainer>
            {isCollapsed || (
                <BodyContainer>
                    <SanitizedHTML dirtyHTML={props.body} />
                </BodyContainer>
            )}
            {props.composeType && <EmailCompose
                email={props.subject i guess}
            />}
            <div style={{ width: '100%' }}>yo whats up man</div>
        </DetailsViewContainer>
    )
}

export default EmailTemplate

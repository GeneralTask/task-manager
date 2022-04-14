import { Colors, Typography } from '../../styles'
import styled from 'styled-components'
import React, { useEffect, useState } from 'react'
import { TaskHTMLBody } from '../atoms/TaskHTMLBody'
import { removeHTMLTags } from '../../utils/utils'

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
interface DetailsTemplateProps {
    sender: string
    time_sent?: string
    body: string
    collapsed?: boolean
}

const EmailTemplate = (props: DetailsTemplateProps) => {
    const [isCollapsed, setIsCollapsed] = useState(props.collapsed ?? false)

    useEffect(() => {
        setIsCollapsed(!!props.collapsed)
    }, [props.collapsed])

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
                    <TaskHTMLBody dirtyHTML={props.body} />
                </BodyContainer>
            )}
        </DetailsViewContainer>
    )
}

export default EmailTemplate

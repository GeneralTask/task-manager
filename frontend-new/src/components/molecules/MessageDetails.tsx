import React, { useEffect, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import webStyled from 'styled-components'
import styled from 'styled-components/native'
import { Colors, Spacing, Typography } from '../../styles'
import { logos } from '../../styles/images'
import { TMessage } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import TaskHTMLBody from '../atoms/TaskHTMLBody'

const DetailsViewContainer = styled.View`
    display: flex;
    flex-direction: column;
    background-color: ${Colors.gray._50};
    width: 640px;
    margin-top: ${Spacing.margin.large}px;
    padding: ${Spacing.padding.medium}px;
`
const TaskTitleButtonsContainer = styled.View`
    display: flex;
    flex-direction: row;
    align-items: center;
    z-index: 1;
    height: 50px;
`
const TaskTitleContainer = styled.View`
    display: flex;
    flex-direction: row;
    align-items: center;
`
const Title = webStyled.div`
    background-color: inherit;
    color: ${Colors.gray._600};
    font: inherit;
    font-size: ${Typography.xSmall.fontSize}px;
    font-weight: ${Typography.weight._600.fontWeight};
    border: none;
    resize: none;
    outline: none;
    overflow: hidden;
    display: flex;
    flex: 1;
    :focus {
        outline: 1px solid ${Colors.gray._500};
    }
`
const BodyContainer = styled.View`
    margin-top: ${Spacing.margin.medium}px;
    flex: 1;
    overflow: auto;
`

interface DetailsViewProps {
    message: TMessage
}
const DetailsView = (props: DetailsViewProps) => {
    const [message, setMessage] = useState<TMessage>(props.message)

    useEffect(() => {
        ReactTooltip.rebuild()
    }, [])

    // Update the state when the message changes
    useEffect(() => {
        setMessage(props.message)
    }, [props.message])

    return (
        <DetailsViewContainer>
            <TaskTitleButtonsContainer>
                <Icon source={logos[message.source.logo_v2]} size="small" />
            </TaskTitleButtonsContainer>
            <TaskTitleContainer>
                <Title>{message.title}</Title>
            </TaskTitleContainer>
            <BodyContainer>
                <TaskHTMLBody dirtyHTML={message.body} />
            </BodyContainer>
        </DetailsViewContainer>
    )
}

export default DetailsView

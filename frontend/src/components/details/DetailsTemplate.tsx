import { Colors, Spacing, Typography } from '../../styles'
import styled from 'styled-components'
import React from 'react'
import { INPUT_VARIABLE_DEFAULT_LINE_HEIGHT } from '../../styles/dimensions'

const DetailsViewContainer = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: ${Colors.gray._50};
    overflow: scroll;
    min-width: 300px;
    margin-top: ${Spacing.margin._24}px;
    padding: ${Spacing.padding._16}px;
`
const DetailsTopContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    z-index: 1;
    height: 50px;
`
const TaskTitleContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
`
const BodyContainer = styled.div`
    flex: 1;
`
export const TitleInput = styled.textarea`
    background-color: inherit;
    color: ${Colors.gray._600};
    font: inherit;
    font-size: ${Typography.large.fontSize};
    font-weight: ${Typography.weight._600};
    border: none;
    resize: none;
    outline: none;
    overflow: hidden;
    display: flex;
    flex: 1;
    margin-bottom: ${Spacing.margin._16}px;
    :focus {
        outline: 1px solid ${Colors.gray._500};
    }
    height: ${INPUT_VARIABLE_DEFAULT_LINE_HEIGHT}px;
`
export const Title = styled.div`
    background-color: inherit;
    color: ${Colors.gray._600};
    font: inherit;
    font-size: ${Typography.xSmall.fontSize};
    font-weight: ${Typography.weight._600};
    border: none;
    resize: none;
    outline: none;
    overflow: hidden;
    display: flex;
    flex: 1;
`
export const BodyTextArea = styled.textarea`
    width: 100%;
    height: 100%;
    display: block;
    background-color: inherit;
    border: 1px solid transparent;
    resize: none;
    outline: none;
    overflow: auto;
    padding: ${Spacing.margin._8}px;
    font: inherit;
    color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize};
    box-sizing: border-box;
    :focus {
        border: 1px solid ${Colors.gray._500};
    }
`
export const FlexGrowView = styled.div`
    flex: 1;
`
interface DetailsTemplateProps {
    top: React.ReactNode
    title: React.ReactNode
    subtitle?: React.ReactNode
    body: React.ReactNode
}

const DetailsTemplate = (props: DetailsTemplateProps) => {
    return (
        <DetailsViewContainer data-testid="details-view-container">
            <DetailsTopContainer>{props.top}</DetailsTopContainer>
            <TaskTitleContainer>{props.title}</TaskTitleContainer>
            {props.subtitle}
            <BodyContainer>{props.body}</BodyContainer>
        </DetailsViewContainer>
    )
}

export default DetailsTemplate

import { Colors, Spacing, Typography } from '../../styles'

import styled from 'styled-components/native'
import webStyled from 'styled-components'

const DetailsViewContainer = styled.View`
    display: flex;
    flex-direction: column;
    background-color: ${Colors.gray._50};
    width: 640px;
    margin-top: ${Spacing.margin.large}px;
    padding: ${Spacing.padding.medium}px;
`
const DetailsTopContainer = styled.View`
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
const BodyContainer = styled.View<{ marginTop: boolean }>`
    margin-top: ${props => props.marginTop ? Spacing.margin.medium : 0}px;
    flex: 1;
    overflow: auto;
`
export const TitleInput = webStyled.textarea`
    background-color: inherit;
    color: ${Colors.gray._600};
    font: inherit;
    font-size: ${Typography.large.fontSize}px;
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
export const Title = webStyled.div`
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
`
export const BodyTextArea = webStyled.textarea`
    display: block;
    background-color: inherit;
    border: none;
    resize: none;
    outline: none;
    overflow: auto;
    padding-right: ${Spacing.margin.small}px;
    font: inherit;
    color: ${Colors.gray._600};
    font-size: ${Typography.xSmall.fontSize}px;
    height: 250px;
`
export const FlexGrowView = styled.View`
    flex: 1;
`
interface DetailsTemplateProps {
    top: JSX.Element | JSX.Element[] | undefined | null
    title: JSX.Element | JSX.Element[] | undefined | null
    subtitle?: JSX.Element | JSX.Element[] | undefined | null
    body: JSX.Element | JSX.Element[] | undefined | null
}

const DetailsTemplate = (props: DetailsTemplateProps) => {
    return (
        <DetailsViewContainer>
            <DetailsTopContainer>
                {props.top}
            </DetailsTopContainer>
            <TaskTitleContainer>
                {props.title}
            </TaskTitleContainer>
            {props.subtitle}
            <BodyContainer marginTop={props.subtitle === undefined}>
                {props.body}
            </BodyContainer>
        </DetailsViewContainer>
    )
}

export default DetailsTemplate

import { Border, Colors, Spacing, Typography } from "../../styles"

import NoStyleAnchor from "../atoms/NoStyleAnchor"
import styled from "styled-components"

export const ColumnWidths = {
    title: '30%',
    status: '20%',
    author: '15%',
    comments: '10%',
    branch: '15%',
    link: '10%',
}

type TColumnWidths = keyof typeof ColumnWidths

export const Column = styled.div<{ type: TColumnWidths }>`
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: ${props => ColumnWidths[props.type]};
    padding: ${Spacing.padding._8};
    overflow: hidden;
    white-space: nowrap;
`

export const PullRequestViewContainer = styled.div`
    margin: 0 ${Spacing.margin._8};
`

export const Repository = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing.margin._16};
`

export const PullRequestRow = styled.div`
    display: flex;
    padding: ${Spacing.padding._8};
    background-color: ${Colors.white};
    border-radius: ${Border.radius.large};
`

export const HeaderContainer = styled.div`
    display: flex;
    background-color: ${Colors.gray._100};
    border-radius: ${Border.radius.large};
    color: ${Colors.gray._500};
    padding: ${Spacing.padding._16} ${Spacing.padding._8};
`

export const RepositoryName = styled.div`
    font-size: ${Typography.medium.fontSize};
    color: ${Colors.gray._700};
`

export const TruncatedText = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

export const CommentsCountContainer = styled.div`
    display: flex;
    gap: ${Spacing.margin._8};
`

export const BranchNameContainer = styled.div`
    display: flex;
    align-items: center;
    color: ${Colors.purple._1};
    border: 0.5px solid ${Colors.gray._200};
    border-radius: ${Border.radius.regular};
    padding: ${Spacing.padding._4} ${Spacing.padding._4};
    cursor: pointer;
`

export const LinkButton = styled(NoStyleAnchor)`
    margin: auto;
    padding: ${Spacing.padding._8};
    background-color: ${Colors.gray._100};
    border-radius: ${Border.radius.large};
    cursor: pointer;
`

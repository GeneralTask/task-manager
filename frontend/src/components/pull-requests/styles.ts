import { Border, Colors, Spacing, Typography } from '../../styles'

import NoStyleAnchor from '../atoms/NoStyleAnchor'
import styled from 'styled-components'

export const ColumnWidths = {
    link: '10%',
    title: '50%',
    status: '30%',
    comments: '10%',
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

const StatusColors = Object.freeze({
    red: {
        text: '#FF0000B2',
        background: '#FFE4E4B2',
    },
    yellow: {
        text: '#F5AF19',
        background: '#DFA0191A',
    },
    green: {
        text: '#00A538',
        background: '#E5FFE9',
    },
    gray: {
        text: '#D0D0D0',
        background: '#BBBBBB1A',
    },
})

export type TPullRequestStatusColors = keyof typeof StatusColors

export const Status = styled.div<{ type: TPullRequestStatusColors }>`
    color: ${props => StatusColors[props.type].text};
    background: ${props => StatusColors[props.type].background};
    border-radius: ${Border.radius.large};
    padding: ${Spacing.margin._4} ${Spacing.margin._8};
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: fit-content;
    ${Typography.bodySmall};
`

export const PullRequestViewContainer = styled.div`
    margin: 0 ${Spacing.margin._8};
`

export const Repository = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing.margin._8};
`

export const PullRequestRow = styled.div<{ highlight: boolean }>`
    display: flex;
    padding: ${Spacing.padding._4};
    background-color: ${props => props.highlight ? Colors.gray._100 : Colors.white};
    border-radius: ${Border.radius.large};
    cursor: pointer;
`

export const HeaderContainer = styled.div`
    display: flex;
    background-color: ${Colors.gray._100};
    border-radius: ${Border.radius.large};
    color: ${Colors.gray._500};
    padding: ${Spacing.padding._16} ${Spacing.padding._8};
`

export const RepositoryName = styled.div`
    color: ${Colors.gray._700};
    ${Typography.subtitle};
`

export const TruncatedText = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`

export const CommentsCountContainer = styled.div`
    display: flex;
    align-items: flex-start;
    gap: ${Spacing.margin._8};
    line-height: 1;
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
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    background-color: ${Colors.white};
    border: 1px solid ${Colors.gray._200};
    border-radius: ${Border.radius.large};
    cursor: pointer;
`

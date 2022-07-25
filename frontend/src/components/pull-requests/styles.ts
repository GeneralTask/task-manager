import { Border, Colors, Spacing, Typography } from '../../styles'

import NoStyleAnchor from '../atoms/NoStyleAnchor'
import styled from 'styled-components'
import { TStatusColors } from '../../styles/colors'

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

export const Status = styled.div<{ type: TStatusColors }>`
    color: ${props => Colors.status[props.type].default};
    background: ${props => Colors.status[props.type].light};
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
    background-color: ${props => props.highlight ? Colors.background.medium : Colors.background.white};
    border-radius: ${Border.radius.large};
    cursor: pointer;
`

export const HeaderContainer = styled.div`
    display: flex;
    background-color: ${Colors.background.medium};
    border-radius: ${Border.radius.large};
    color: ${Colors.text.light};
    padding: ${Spacing.padding._16} ${Spacing.padding._8};
`

export const RepositoryName = styled.div`
    color: ${Colors.text.light};
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
    color: ${Colors.gtColor.primary};
    border: 0.5px solid ${Colors.background.dark};
    border-radius: ${Border.radius.regular};
    padding: ${Spacing.padding._4} ${Spacing.padding._4};
    cursor: pointer;
`

export const LinkButton = styled(NoStyleAnchor)`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    background-color: ${Colors.background.white};
    border: 1px solid ${Colors.background.dark};
    border-radius: ${Border.radius.large};
    cursor: pointer;
`

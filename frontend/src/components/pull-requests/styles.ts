import { Border, Colors, Spacing, Typography } from '../../styles'

import NoStyleAnchor from '../atoms/NoStyleAnchor'
import styled from 'styled-components'

export const ColumnWidths = {
    title: '35%',
    status: '25%',
    author: '20%',
    branch: '15%',
    link: '5%',
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

const StatusColors = {
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
}

export type TPullRequestStatusColors = keyof typeof StatusColors

export const Status = styled.div<{ type: TPullRequestStatusColors }>`
    font-weight: ${Typography.weight._500};
    width: fit-content;
    padding: ${Spacing.margin._4} ${Spacing.margin._8};
    color: ${props => StatusColors[props.type].text};
    background: ${props => StatusColors[props.type].background};
    border-radius: ${Border.radius.large};
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

export const LinkButton = styled(NoStyleAnchor)`
    margin: auto;
    padding: ${Spacing.padding._8};
    background-color: ${Colors.gray._100};
    border-radius: ${Border.radius.large};
    cursor: pointer;
`

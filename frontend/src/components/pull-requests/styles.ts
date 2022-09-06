import { Border, Colors, Spacing, Typography } from '../../styles'
import styled from 'styled-components'
import { TStatusColors } from '../../styles/colors'

export const ColumnWidths = {
    link: '10%',
    title: '50%',
    status: '30%',
    comments: '10%',
}

const PULL_REQUEST_HEIGHT = '64px'

type TColumnWidths = keyof typeof ColumnWidths

export const Column = styled.div<{ type: TColumnWidths }>`
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: ${props => ColumnWidths[props.type]};
    padding: ${Spacing.extraSmall};
    overflow: hidden;
    white-space: nowrap;
`

export const Status = styled.div<{ type: TStatusColors }>`
    color: ${Colors.text.black};
    background: ${props => Colors.status[props.type].light};
    border: ${Border.stroke.medium} solid ${props => Colors.status[props.type].default};
    border-radius: ${Border.radius.small};
    padding: ${Spacing.mini} ${Spacing.extraSmall};
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: fit-content;
    ${Typography.bodySmall};
`

export const Repository = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing.extraSmall};
`

export const PullRequestRow = styled.div<{ isSelected: boolean }>`
    display: flex;
    height: ${PULL_REQUEST_HEIGHT};
    padding: ${Spacing.mini};
    background-color: ${(props) =>
        props.isSelected ? Colors.background.medium : Colors.background.white};
    box-shadow: ${(props) => (props.isSelected ? `inset 1005px 0px 0px -1000px ${Colors.gtColor.primary}` : 'none')};
    border-radius: ${Border.radius.small};
    cursor: pointer;
    &:hover {
        background-color: ${Colors.background.medium};
    }
`

export const HeaderContainer = styled.div`
    display: flex;
    background-color: ${Colors.background.medium};
    border-radius: ${Border.radius.large};
    color: ${Colors.text.light};
    padding: ${Spacing.regular} ${Spacing.extraSmall};
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
    gap: ${Spacing.extraSmall};
    line-height: 1;
`

export const BranchNameContainer = styled.div`
    display: flex;
    align-items: center;
    color: ${Colors.gtColor.primary};
    border: ${Border.stroke.medium} solid ${Colors.border.gray};
    border-radius: ${Border.radius.small};
    padding: ${Spacing.mini} ${Spacing.mini};
    gap: ${Spacing.mini};
    cursor: pointer;
`

export const LinkButtonContainer = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
`

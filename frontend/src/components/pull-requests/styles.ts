import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { TStatusColors } from '../../styles/colors'

export const Column = styled.div`
    display: flex;
    align-items: center;
    margin-left: auto;
    gap: ${Spacing._16};
`
export const Status = styled.div<{ type: TStatusColors }>`
    display: flex;
    gap: ${Spacing._4};
    color: ${Colors.text.black};
    background: ${(props) => Colors.status[props.type].light};
    border: ${Border.stroke.medium} solid ${(props) => Colors.status[props.type].default};
    border-radius: ${Border.radius.medium};
    padding: ${Spacing._4} ${Spacing._8};
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: fit-content;
    ${Typography.body.small};
    ${Typography.bold};
`

export const Repository = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
`
export const PullRequestRow = styled.div<{ isSelected: boolean }>`
    display: flex;
    padding: ${Spacing._12} ${Spacing._8} ${Spacing._12} ${Spacing._16};
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.small};
    position: relative;
    cursor: pointer;
    box-shadow: ${Shadows.deprecated_button.default};
    &:hover {
        background-color: ${Colors.background.sub};
        outline: ${Border.stroke.medium} solid ${Colors.background.border};
    }
    gap: ${Spacing._16};
    align-items: center;
`
export const TitleContainer = styled.div`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    height: fit-content;
    ${Typography.body.large};
`
export const RepositoryName = styled.div`
    color: ${Colors.text.light};
    ${Typography.title.medium};
`
export const BranchNameContainer = styled.div`
    display: flex;
    align-items: center;
    color: ${Colors.legacyColors.purple};
    border: ${Border.stroke.medium} solid ${Colors.legacyColors.purple};
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.medium};
    padding: ${Spacing._4} ${Spacing._8};
    gap: ${Spacing._8};
    ${Typography.body.small};
    ${Typography.bold};
    cursor: pointer;
`
export const LinkButtonContainer = styled.div`
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
`
export const BranchNameText = styled.span`
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`

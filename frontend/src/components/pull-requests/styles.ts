import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { TStatusColors } from '../../styles/colors'

const PULL_REQUEST_HEIGHT = '48px'

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
    ${Typography.deprecated_label};
    ${Typography.deprecated_bold};
`

export const Repository = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
`
export const PullRequestRow = styled.div<{ isSelected: boolean }>`
    display: flex;
    height: ${PULL_REQUEST_HEIGHT};
    padding: ${Spacing._4} ${Spacing._4} ${Spacing._4} ${Spacing._24};
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.small};
    position: relative;
    cursor: pointer;
    box-shadow: ${Shadows.deprecated_button.default};
    &:hover {
        background-color: ${Colors.background.medium};
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
`
export const RepositoryName = styled.div`
    color: ${Colors.text.light};
    ${Typography.deprecated_subtitle};
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
    ${Typography.deprecated_label};
    ${Typography.deprecated_bold};
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

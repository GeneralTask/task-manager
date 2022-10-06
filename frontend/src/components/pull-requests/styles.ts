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
    color: ${Colors.text.black};
    background: ${(props) => Colors.status[props.type].light};
    border: ${Border.stroke.medium} solid ${(props) => Colors.status[props.type].default};
    border-radius: ${Border.radius.small};
    padding: ${Spacing._4} ${Spacing._8};
    white-space: nowrap;
    text-overflow: ellipsis;
    max-width: fit-content;
    ${Typography.bodySmall};
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
    border-radius: ${Border.radius.mini};
    position: relative;
    cursor: pointer;
    box-shadow: ${Shadows.button.default};
    &:hover {
        background-color: ${Colors.background.medium};
        outline: ${Border.stroke.medium} solid ${Colors.border.light};
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
export const HeaderContainer = styled.div`
    display: flex;
    background-color: ${Colors.background.medium};
    border-radius: ${Border.radius.large};
    color: ${Colors.text.light};
    padding: ${Spacing._16} ${Spacing._8};
`
export const RepositoryName = styled.div`
    color: ${Colors.text.light};
    ${Typography.subtitle};
`
export const BranchNameContainer = styled.div`
    display: flex;
    align-items: center;
    color: ${Colors.gtColor.primary};
    border: ${Border.stroke.medium} solid ${Colors.border.gray};
    border-radius: ${Border.radius.small};
    padding: ${Spacing._4} ${Spacing._4};
    gap: ${Spacing._8};
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

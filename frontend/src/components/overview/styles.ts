import styled from 'styled-components'
import { Border, Colors, Spacing, Typography, Shadows } from '../../styles'
import NoStyleButton from '../atoms/buttons/NoStyleButton'

export const ViewContainer = styled.div`
    padding: ${Spacing.padding._12};
    background-color: ${Colors.white};
    border-radius: ${Border.radius.small};
    margin: 0 ${Spacing.margin._24} ${Spacing.margin._16};
    box-shadow: ${Shadows.small};
`
export const ViewHeader = styled.div`
    margin-bottom: ${Spacing.margin._8};
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: ${Colors.gray._700};
    font-size: ${Typography.medium.fontSize};
    line-height: ${Typography.medium.lineHeight};
    font-weight: ${Typography.weight._600};
`
export const RemoveButton = styled(NoStyleButton)`
    padding: ${Spacing.padding._8};
    border-radius: ${Border.radius.small};
    &:hover {
        background-color: ${Colors.gray._200};
    }
`
export const SelectedView = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    border-radius: ${Border.radius.large};
    border: 1px solid ${Colors.purple._3};
    padding: ${Spacing.padding._12};
    margin: ${Spacing.margin._4} 0;
    gap: ${Spacing.margin._12};
    font-size: ${Typography.medium.fontSize};
    line-height: ${Typography.medium.lineHeight};
    color: ${Colors.gray._700};
`
export const EditViewsDeleteButton = styled(RemoveButton)`
    margin-left: auto;
`
export const PaginateTextButton = styled(NoStyleButton)`
    color: #069;
    text-decoration: underline;
    cursor: pointer;
    font-size: ${Typography.xSmall.fontSize};
    line-height: ${Typography.xSmall.lineHeight};
    margin: ${Spacing.margin._4} ${Spacing.margin._8} 0;
`
export const OptimisticItemsContainer = styled.div`
    height: 100px;
    display: flex;
`

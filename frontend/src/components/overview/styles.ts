import styled from 'styled-components'
import { Border, Colors, Spacing, Typography, Shadows } from '../../styles'
import NoStyleButton from '../atoms/buttons/NoStyleButton'

export const ViewContainer = styled.div`
    padding: ${Spacing.padding._12};
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.small};
    margin: 0 ${Spacing.margin._24} ${Spacing.margin._16};
    box-shadow: ${Shadows.small};
`
export const ViewHeader = styled.div`
    margin-bottom: ${Spacing.margin._8};
    color: ${Colors.text.light};
    ${Typography.subtitle};
`
export const RemoveButton = styled(NoStyleButton)`
    padding: ${Spacing.padding._8};
    border-radius: ${Border.radius.small};
    &:hover {
        background-color: ${Colors.background.dark};
    }
`
export const SelectedView = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    border-radius: ${Border.radius.large};
    border: 1px solid ${Colors.gtColor.secondary};
    padding: ${Spacing.padding._12};
    margin: ${Spacing.margin._4} 0;
    gap: ${Spacing.margin._12};
    color: ${Colors.text.light};
    ${Typography.body};
`
export const EditViewsDeleteButton = styled(RemoveButton)`
    margin-left: auto;
`
export const PaginateTextButton = styled(NoStyleButton)`
    color: #069;
    text-decoration: underline;
    cursor: pointer;
    margin: ${Spacing.margin._4} ${Spacing.margin._8} 0;
    ${Typography.bodySmall};
`
export const OptimisticItemsContainer = styled.div`
    height: 100px;
    display: flex;
`

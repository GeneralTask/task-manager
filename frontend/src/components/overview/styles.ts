import styled from 'styled-components'
import { Border, Colors, Spacing, Typography, Shadows } from '../../styles'
import NoStyleButton from '../atoms/buttons/NoStyleButton'

export const ViewContainer = styled.div`
    padding: ${Spacing.small};
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.small};
    margin: ${Spacing.regular} 0;
    box-shadow: ${Shadows.light};
`
export const ViewHeader = styled.div`
    margin-bottom: ${Spacing.extraSmall};
    color: ${Colors.text.light};
    ${Typography.subtitle};
`
export const RemoveButton = styled(NoStyleButton)`
    padding: ${Spacing.extraSmall};
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
    border: ${Border.stroke.medium} solid ${Colors.gtColor.secondary};
    padding: ${Spacing.small};
    margin: ${Spacing.mini} 0;
    gap: ${Spacing.small};
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
    margin: ${Spacing.mini} ${Spacing.extraSmall} 0;
    ${Typography.bodySmall};
`
export const OptimisticItemsContainer = styled.div`
    height: 100px;
    display: flex;
`

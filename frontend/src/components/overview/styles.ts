import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import NoStyleButton from '../atoms/buttons/NoStyleButton'

export const ViewContainer = styled.div`
    padding: ${Spacing._12};
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.small};
    margin: ${Spacing._16} 0;
    box-shadow: ${Shadows.light};
`
export const ViewHeader = styled.div`
    margin: ${Spacing._8} 0;
    background-color: ${Colors.background.white};
    cursor: pointer;
`
export const ViewName = styled.div`
    color: ${Colors.text.light};
    ${Typography.subtitle};
`
export const RemoveButton = styled(NoStyleButton)`
    padding: ${Spacing._8};
    border-radius: ${Border.radius.small};
    &:hover {
        background-color: ${Colors.background.dark};
    }
`
export const SelectedList = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    border-radius: ${Border.radius.mini};
    border: ${Border.stroke.medium} solid ${Colors.gtColor.secondary};
    padding: ${Spacing._12};
    margin: ${Spacing._4} 0;
    gap: ${Spacing._12};
    color: ${Colors.text.light};
    ${Typography.body};
    cursor: pointer;
`
export const EditViewsDeleteButton = styled(RemoveButton)`
    margin-left: auto;
`
export const PaginateTextButton = styled(NoStyleButton)`
    color: ${Colors.text.purple};
    text-decoration: underline;
    cursor: pointer;
    margin: ${Spacing._4} ${Spacing._8} 0;
    ${Typography.bodySmall};
`
export const OptimisticItemsContainer = styled.div`
    height: 100px;
    display: flex;
`

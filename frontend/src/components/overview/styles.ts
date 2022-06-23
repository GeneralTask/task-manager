import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import NoStyleButton from '../atoms/buttons/NoStyleButton'

export const OverviewPageContainer = styled.div`
    margin: 0 ${Spacing.margin._8};    
`
export const BlockContainer = styled.div`
    padding: ${Spacing.padding._12};
    background-color: ${Colors.white};
    border-radius: ${Border.radius.small};
    margin-bottom: ${Spacing.margin._16};
`
export const BlockHeader = styled.div`
    margin: ${Spacing.margin._8} 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: ${Colors.gray._700};
    font-size: ${Typography.medium.fontSize};
    font-weight: ${Typography.weight._600};
`
export const RemoveButton = styled(NoStyleButton)`
    padding: ${Spacing.padding._8};
    border-radius: ${Border.radius.small};
    &:hover {
        background-color: ${Colors.gray._200};
    }
`

import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import NoStyleButton from '../atoms/buttons/NoStyleButton'

export const OverviewPageContainer = styled.div`
    display: flex;
    flex-direction: column;
    position: relative;
    flex: 1;
`
export const PageHeader = styled.div`
    padding: ${Spacing.padding._16};
    color: ${Colors.gray._500};
    font-size: ${Typography.small.fontSize};
    border-bottom: 2px solid ${Colors.gray._200};
`
export const BlockContainer = styled.div`
    padding: ${Spacing.padding._12};
    background-color: ${Colors.white};
    border-radius: ${Border.radius.small};
    margin: 0 ${Spacing.margin._24} ${Spacing.margin._16};
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
// placeholder for details view
export const DetailsViewContainer = styled.div`
    background-color: ${Colors.white};
    padding-top: 50vh;
    min-width: 400px;
`

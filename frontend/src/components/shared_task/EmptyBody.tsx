import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'

const EmptyBodyContainer = styled.div`
    color: ${Colors.background.hover};
    padding: ${Spacing._8};
    ${Typography.body.medium};
`

const EmptyBody = () => {
    return <EmptyBodyContainer>No description</EmptyBodyContainer>
}

export default EmptyBody

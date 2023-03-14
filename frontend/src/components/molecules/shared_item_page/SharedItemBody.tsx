import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../../styles'

const SharedItemBody = styled.div`
    margin-top: 110px;
    background: ${Colors.background.white};
    border-radius: ${Border.radius.medium};
    box-shadow: ${Shadows.deprecated_medium};
    display: flex;
    flex-direction: column;
    padding: ${Spacing._24};
    gap: ${Spacing._24};
    margin: ${Spacing._24};
`

export default SharedItemBody

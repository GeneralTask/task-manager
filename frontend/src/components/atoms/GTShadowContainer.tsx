import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../styles'

const GTShadowContainer = styled.div`
    width: 100%;
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.mini};
    padding: ${Spacing._16};
    box-shadow: ${Shadows.light};
    box-sizing: border-box;
`

export default GTShadowContainer

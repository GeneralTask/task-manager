import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../styles'

const GTContainer = styled.div`
    width: 100%;
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.mini};
    padding: ${Spacing._16};
    box-shadow: ${Shadows.light};
`

export default GTContainer

import { Border, Colors, Spacing } from '../../styles'

import styled from 'styled-components'

const ActionValueContainer = styled.div`
    padding: ${Spacing._8};
    background-color: ${Colors.background.dark};
    border-radius: ${Border.radius.medium};
`
interface ActionValueProps {
    value: string
}

const ActionValue = ({ value }: ActionValueProps) => {
    return <ActionValueContainer>{value}</ActionValueContainer>
}

export default ActionValue

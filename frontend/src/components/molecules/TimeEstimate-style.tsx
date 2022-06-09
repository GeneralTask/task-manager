import { Colors, Shadows } from '../../styles'
import { weight, xxSmall } from '../../styles/typography'

import styled from 'styled-components'

const TIME_ESTIMATOR_WIDTH = 150
const TIME_ESTIMATOR_PADDING = 10
export const TimeEstimateContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: ${TIME_ESTIMATOR_WIDTH}px;
    position: absolute;
    background-color: ${Colors.white};
    border-radius: 10px;
    box-shadow: ${Shadows.medium};
    z-index: 1;
    top: 100%;
    right: 0;
    padding: ${TIME_ESTIMATOR_PADDING}px;
    cursor: default;
`

export const Header = styled.div`
    font-weight: ${weight._600};
    font-size: ${xxSmall.fontSize};
    line-height: ${xxSmall.lineHeight};
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${Colors.gray._400};
    padding: 5px;
`

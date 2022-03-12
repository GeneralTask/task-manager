import styled from 'styled-components'
import { Colors } from '../../styles'
import { weight, xxSmall } from '../../styles/typography'

const TIME_ESTIMATOR_WIDTH = 150
const TIME_ESTIMATOR_PADDING = 10
export const TimeEstimateContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: ${TIME_ESTIMATOR_WIDTH}px;
    position: absolute;
    background-color: ${Colors.white};
    border-radius: 10px;
    box-shadow: 0 0 5px ${Colors.gray._100};
    z-index: 1;
    top: 100%;
    right: 0;
    padding: ${TIME_ESTIMATOR_PADDING}px;
    cursor: default;
`

export const Header = styled.div`
    font-family: Switzer-Variable;
    font-weight: ${weight._600.fontWeight};
    font-size: ${xxSmall.fontSize}px;
    line-height: ${xxSmall.lineHeight}px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${Colors.gray._400};
    padding: 5px;
`

import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { emptyFunction } from '../../utils/utils'
import GTIconButton from '../atoms/buttons/GTIconButton'

const Banner = styled.div`
    display: flex;
    background-color: ${Colors.background.medium};
    border: ${Border.stroke.small} solid ${Colors.border.light};
    border-radius: ${Border.radius.small};
    gap: ${Spacing._16};
    padding: ${Spacing._8};
    margin-bottom: ${Spacing._16};
`
const Text = styled.div`
    ${Typography.label};
    margin: ${Spacing._4};
`

const SmartPrioritizationBanner = () => {
    return (
        <Banner>
            <Text>
                Your lists have been sorted using Smart Prioritize<sup>AI</sup>. If you’d like to manually order your
                lists go to Edit lists.
            </Text>
            <GTIconButton icon={icons.x} onClick={emptyFunction} tooltipText="Hide" />
        </Banner>
    )
}

export default SmartPrioritizationBanner

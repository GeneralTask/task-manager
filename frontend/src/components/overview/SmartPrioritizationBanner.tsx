import styled from 'styled-components'
import { useGTLocalStorage } from '../../hooks'
import { Border, Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import GTIconButton from '../atoms/buttons/GTIconButton'

const Banner = styled.div`
    display: flex;
    background-color: ${Colors.background.medium};
    border: ${Border.stroke.small} solid ${Colors.background.border};
    border-radius: ${Border.radius.small};
    gap: ${Spacing._16};
    padding: ${Spacing._8};
    margin-bottom: ${Spacing._16};
`
const Text = styled.div`
    ${Typography.deprecated_label};
    margin: ${Spacing._4} ${Spacing._8} ${Spacing._8} ${Spacing._8};
`

const SmartPrioritizationBanner = () => {
    const [isUsingSmartPrioritization, setIsUsingSmartPrioritization] = useGTLocalStorage(
        'isUsingSmartPrioritization',
        false,
        true
    )
    if (!isUsingSmartPrioritization) return null
    return (
        <Banner>
            <Text>
                Your lists have been sorted using Smart Prioritize<sup>AI</sup>. If you’d like to manually order your
                lists go to Edit lists.
            </Text>
            <GTIconButton
                icon={icons.x}
                onClick={() => setIsUsingSmartPrioritization(false)}
                tooltipText="Hide banner"
            />
        </Banner>
    )
}

export default SmartPrioritizationBanner

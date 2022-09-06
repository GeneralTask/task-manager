import React from 'react'
import { Colors, Spacing } from '../../styles'
import FeedbackButton from '../molecules/FeedbackButton'
import { Icon } from '../atoms/Icon'
import NavigationSectionLinks from '../navigation_sidebar/NavigationSectionLinks'
import styled from 'styled-components'
import GTButton from '../atoms/buttons/GTButton'
import { useNavigate } from 'react-router-dom'
import { logos } from '../../styles/images'

const NavigationViewContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0px;
    min-height: 0px;
    background-color: ${Colors.background.medium};
    padding: ${Spacing.small};
    box-sizing: border-box;
`
const NavigationViewHeader = styled.div`
    flex-basis: 24px;
    width: 100%;
    margin-bottom: ${Spacing.regular};
`
const OverflowContainer = styled.div`
    flex: 1;
    overflow: auto;
`
const GapView = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing.extraSmall};
    padding-bottom: ${Spacing.extraSmall};
    margin-top: auto;
`

const NavigationView = () => {
    const navigate = useNavigate()

    return (
        <NavigationViewContainer>
            <NavigationViewHeader>
                <Icon size="medium" icon={logos.generaltask} color={Colors.icon.purple} />
            </NavigationViewHeader>
            <OverflowContainer>
                <NavigationSectionLinks />
            </OverflowContainer>
            <GapView>
                <FeedbackButton />
                <GTButton
                    value="Settings"
                    styleType="secondary"
                    fitContent={false}
                    onClick={() => navigate('/settings')}
                />
            </GapView>
        </NavigationViewContainer>
    )
}

export default NavigationView

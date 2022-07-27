import React from 'react'
import { Colors, Spacing } from '../../styles'
import FeedbackButton from '../molecules/FeedbackButton'
import { Icon } from '../atoms/Icon'
import NavigationSectionLinks from '../navigation_sidebar/NavigationSectionLinks'
import styled from 'styled-components'
import SettingsButton from '../molecules/SettingsButton'

const NavigationViewContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0px;
    background-color: ${Colors.background.medium};
    padding: ${Spacing.padding._12};
    box-sizing: border-box;
`
const NavigationViewHeader = styled.div`
    flex-basis: 24px;
    width: 100%;
    margin-bottom: ${Spacing.margin._16};
`
const OverflowContainer = styled.div`
    flex: 1;
    overflow: auto;
`
const GapView = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing.margin._8};
    padding-bottom: ${Spacing.padding._8};
    margin-top: auto;
`

const NavigationView = () => (
    <NavigationViewContainer>
        <NavigationViewHeader>
            <Icon size="medium" />
        </NavigationViewHeader>
        <OverflowContainer>
            <NavigationSectionLinks />
        </OverflowContainer>
        <GapView>
            <FeedbackButton />
            <SettingsButton />
        </GapView>
    </NavigationViewContainer>
)

export default NavigationView

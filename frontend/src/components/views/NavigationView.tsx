import React from 'react'
import { margin, padding } from '../../styles/spacing'
import { Colors } from '../../styles'
import FeedbackButton from '../molecules/FeedbackButton'
import { Icon } from '../atoms/Icon'
import NavigationSectionLinks from '../navigation_sidebar/NavigationSectionLinks'
import GTButton from '../atoms/buttons/GTButton'
import { authSignOut } from '../../utils/auth'
import styled from 'styled-components'

const NavigationViewContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 0px;
    background-color: ${Colors.gray._100};
    padding: ${padding._8};
    box-sizing: border-box;
`
const NavigationViewHeader = styled.div`
    flex-basis: 24px;
    width: 100%;
    margin-bottom: ${margin._16};
`
const OverflowContainer = styled.div`
    flex: 1;
    overflow: auto;
`
const GapView = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${margin._8};
    padding-bottom: ${padding._8};
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
            <GTButton value="Sign Out" styleType="secondary" onClick={authSignOut} />
        </GapView>
    </NavigationViewContainer>
)

export default NavigationView

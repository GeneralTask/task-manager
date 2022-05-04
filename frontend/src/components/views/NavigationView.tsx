import { Colors } from '../../styles'
import React from 'react'
import { margin, padding } from '../../styles/spacing'
import { useGetTasks } from '../../services/api-query-hooks'
import { useLocation, useParams } from 'react-router-dom'

import FeedbackButton from '../molecules/FeedbackButton'
import { Icon } from '../atoms/Icon'
import NavigationSectionLinks from '../navigation_sidebar/NavigationSectionLinks'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import { authSignOut } from '../../utils/auth'
import styled from 'styled-components'
import { useAppDispatch } from '../../redux/hooks'

const NavigationViewContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 232px;
    background-color: ${Colors.gray._100};
    padding: ${padding._8}px;
    box-sizing: border-box;
`
const NavigationViewHeader = styled.div`
    flex-basis: 24px;
    width: 100%;
    margin-bottom: ${margin._16}px;
`
const OverflowContainer = styled.div`
    flex: 1;
    overflow: auto;
`
const GapView = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${margin._8}px;
    padding-bottom: ${padding._8}px;
    margin-top: auto;
`

const NavigationView = () => {
    const dispatch = useAppDispatch()
    const { data: taskSections } = useGetTasks()
    const { section: sectionIdParam } = useParams()
    const { pathname } = useLocation()

    return (
        <NavigationViewContainer>
            <NavigationViewHeader>
                <Icon size="medium" />
            </NavigationViewHeader>
            <OverflowContainer>
                {taskSections && (
                    <NavigationSectionLinks
                        taskSections={taskSections}
                        sectionId={sectionIdParam || ''}
                        pathName={pathname.split('/')[1]}
                    />
                )}
            </OverflowContainer>
            <GapView>
                <FeedbackButton />
                <RoundedGeneralButton value="Sign Out" textStyle="dark" onPress={() => authSignOut(dispatch)} />
            </GapView>
        </NavigationViewContainer>
    )
}

export default NavigationView

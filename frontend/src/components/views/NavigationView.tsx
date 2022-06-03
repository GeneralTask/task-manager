import { Colors } from '../../styles'
import React, { useMemo } from 'react'
import { margin, padding } from '../../styles/spacing'
import { useGetInfiniteThreads, useGetTasks } from '../../services/api-query-hooks'
import { useLocation, useParams } from 'react-router-dom'

import FeedbackButton from '../molecules/FeedbackButton'
import { Icon } from '../atoms/Icon'
import NavigationSectionLinks from '../navigation_sidebar/NavigationSectionLinks'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
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

const NavigationView = () => {
    const { data: taskSections } = useGetTasks()
    const { data: threadData } = useGetInfiniteThreads()
    const { section: sectionIdParam } = useParams()
    const { pathname } = useLocation()

    const threads = useMemo(() => threadData?.pages.flat().filter((thread) => thread != null) ?? [], [threadData])

    return (
        <NavigationViewContainer>
            <NavigationViewHeader>
                <Icon size="medium" />
            </NavigationViewHeader>
            <OverflowContainer>
                {taskSections && threadData && (
                    <NavigationSectionLinks
                        taskSections={taskSections}
                        threads={threads}
                        sectionId={sectionIdParam || ''}
                        pathName={pathname.split('/')[1]}
                    />
                )}
            </OverflowContainer>
            <GapView>
                <FeedbackButton />
                <RoundedGeneralButton value="Sign Out" textStyle="dark" onClick={authSignOut} />
            </GapView>
        </NavigationViewContainer>
    )
}

export default NavigationView

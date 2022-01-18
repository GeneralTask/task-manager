import React from 'react'
import styled from 'styled-components'
import { NavbarPages } from '../../helpers/enums'
import { TASKS_BACKGROUND_GRADIENT, TASKS_BACKROUND } from '../../helpers/styles'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setShowCalendarSidebar } from '../../redux/tasksPageSlice'
import CalendarSidebar from '../calendar/CalendarSidebar'
import ExpandCollapse from '../common/ExpandCollapse'
import Navbar from '../Navbar'

const MessagesPageContainer = styled.div`
    display: flex;
    height: 100%;
    background-image: linear-gradient(to bottom right, ${TASKS_BACKGROUND_GRADIENT}, ${TASKS_BACKROUND} 90%);
`

const MessagesContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    min-width: 600px;
    flex: 1;
    overflow: scroll;
    position: relative;
`
const Header = styled.div`
    display: flex;
    font-size: 32px;
    margin-bottom: 24px;
    width: 60%;
    align-self: center;
    justify-content: flex-start;
    position: relative;
    min-width: 500px;
`
const TopBanner = styled.div`
    display: flex;
    /* width: 100%; */
    justify-content: end;
    margin-top: 24px;
    padding-right: 24px;
`

const CollapseCalendarSidebar = React.memo(() => {
    const dispatch = useAppDispatch()
    const calendarSidebarShown = useAppSelector((state) => state.tasks_page.events.show_calendar_sidebar)
    if (!calendarSidebarShown) {
        return <ExpandCollapse direction="left" onClick={() => dispatch(setShowCalendarSidebar(true))} />
    } else return <></>
})

const MessagesPage: React.FC = () => {
    const calendarSidebarShown = useAppSelector((state) => state.tasks_page.events.show_calendar_sidebar)
    return (
        <MessagesPageContainer>
            <Navbar currentPage={NavbarPages.MESSAGES_PAGE} />
            <MessagesContentContainer>
                <TopBanner>
                    <CollapseCalendarSidebar />
                </TopBanner>
                <Header>Messages</Header>
                {/* <Setting>
                    <Accounts />
                </Setting>
                <Setting>
                    <Preferences />
                </Setting> */}
            </MessagesContentContainer>
            {calendarSidebarShown && <CalendarSidebar />}
        </MessagesPageContainer>
    )
}

export default MessagesPage

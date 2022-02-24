import { AbortID, FetchStatusEnum } from '../../helpers/enums'
import { MESSAGES_FETCH_INTERVAL, TASKS_FETCH_INTERVAL, TASKS_URL } from '../../constants'
import { Navigate, useParams } from 'react-router-dom'
import React, { useCallback, useEffect } from 'react'
import { makeAuthorizedRequest, useInterval } from '../../helpers/utils'
import { setShowCalendarSidebar, setTasks, setTasksFetchStatus } from '../../redux/tasksPageSlice'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'

import CalendarFull from '../calendar/CalendarFull'
import CalendarSidebar from '../calendar/CalendarSidebar'
import EventAlert from '../alert/EventAlert'
import ExpandCollapse from '../common/ExpandCollapse'
import Navbar from '../navbar/Navbar'
import RefreshButton from './RefreshButton'
import TaskSection from './TaskSection'
import TaskStatus from './TaskStatus'
import styled from 'styled-components'
import { useDragDropManager } from 'react-dnd'
import { useFetchLinkedAccounts } from '../settings/Accounts'
import { useFetchMessages } from '../messages/MessagesPage'
import { useFetchSettings } from '../settings/Preferences'
import { NavbarPage } from '../../helpers/types'

const TasksPageContainer = styled.div`
    display: flex;
    height: 100%;
`
const TasksContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    min-width: 600px;
`
const Header = styled.div`
    display: flex;
    margin-bottom: 24px;
    width: 60%;
    align-self: center;
    justify-content: flex-start;
    position: relative;
    min-width: 500px;
`
const HeaderText = styled.div`
    font-size: 32px;
`
const TopBanner = styled.div`
    display: flex;
    justify-content: end;
    margin-top: 24px;
    padding-right: 24px;
`

export const useFetchTasks = (): (() => Promise<void>) => {
    const dispatch = useAppDispatch()
    const dragDropMonitor = useDragDropManager().getMonitor()

    const fetchTasks = useCallback(async () => {
        const isDragging = dragDropMonitor.isDragging()
        if (isDragging) {
            return
        }
        try {
            dispatch(setTasksFetchStatus(FetchStatusEnum.LOADING))
            const response = await makeAuthorizedRequest({
                url: TASKS_URL,
                method: 'GET',
                abortID: AbortID.TASKS,
            })
            if (!response.ok) {
                dispatch(setTasksFetchStatus(FetchStatusEnum.ERROR))
            } else {
                const resj = await response.json()
                dispatch(setTasksFetchStatus(FetchStatusEnum.SUCCESS))
                dispatch(setTasks(resj))
            }
        } catch (e) {
            console.log({ e })
            dispatch(setTasksFetchStatus(FetchStatusEnum.ERROR))
        }
    }, [])

    return fetchTasks
}

interface TasksProps {
    currentPage: NavbarPage
}
function Tasks({ currentPage }: TasksProps): JSX.Element {
    const task_sections = useAppSelector((state) => state.tasks_page.tasks.task_sections)
    const [currentSection, headerText, sectionIndex] = (() => {
        const index = currentPage.sectionIndex
        const section = index ? task_sections[index] : null
        return [section, currentPage.name, index]
        // switch (currentPage) {
        //     case NavbarPage.TODAY_PAGE:
        //         return [task_sections[0], 'Today', 0]
        //     case NavbarPage.BLOCKED_PAGE:
        //         return [task_sections[1], 'Blocked', 1]
        //     case NavbarPage.BACKLOG_PAGE:
        //         return [task_sections[2], 'Backlog', 2]
        //     case NavbarPage.DONE_PAGE:
        //         return [task_sections[3], 'Done', 3]
        //     default:
        //         return [task_sections[0], 'Today', 0]
        // }
    })()
    const fetchTasks = useFetchTasks()
    const fetchMessages = useFetchMessages()
    const fetchSettings = useFetchSettings()
    const fetchLinkedAccounts = useFetchLinkedAccounts()
    useEffect(() => {
        // fetch settings and linked accounts once on tasks page load
        fetchSettings()
        fetchLinkedAccounts()
    }, [])

    useInterval(fetchTasks, TASKS_FETCH_INTERVAL)
    useInterval(fetchMessages, MESSAGES_FETCH_INTERVAL)

    if (currentSection == null) {
        return <TaskStatus />
    }

    const TaskSectionElement = <TaskSection task_section={currentSection} task_section_index={sectionIndex} />

    return (
        <TasksContentContainer>
            <TopBanner>
                <CollapseCalendarSidebar />
            </TopBanner>
            <Header>
                <HeaderText>{headerText}</HeaderText>
                <RefreshButton />
            </Header>
            <TaskStatus />
            {TaskSectionElement}
        </TasksContentContainer>
    )
}

const CollapseCalendarSidebar = React.memo(() => {
    const dispatch = useAppDispatch()
    const calendarSidebarShown = useAppSelector((state) => state.tasks_page.events.show_calendar_sidebar)
    if (!calendarSidebarShown) {
        return <ExpandCollapse direction="left" onClick={() => dispatch(setShowCalendarSidebar(true))} />
    } else return <></>
})

export default function TasksPage(): JSX.Element {
    const calendarSidebarShown = useAppSelector((state) => state.tasks_page.events.show_calendar_sidebar)
    const fullCalendarShown = useAppSelector((state) => state.tasks_page.events.show_full_calendar)
    const section = `${useParams().section}_page`
    const currentPage = Object.values(NavbarPage).find((page) => page === section)
    if (currentPage == null) return <Navigate to="/" />
    return (
        <TasksPageContainer>
            <Navbar currentPage={currentPage} />
            {fullCalendarShown ? (
                <CalendarFull />
            ) : (
                <>
                    <EventAlert>
                        <Tasks currentPage={currentPage} />
                    </EventAlert>
                    {calendarSidebarShown && <CalendarSidebar />}
                </>
            )}
        </TasksPageContainer>
    )
}

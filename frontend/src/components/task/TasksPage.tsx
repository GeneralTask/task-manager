import { AbortID, FetchStatusEnum, LogEvents } from '../../redux/enums'
import React, { useCallback, useEffect } from 'react'
import { TASKS_BACKGROUND_GRADIENT, TASKS_BACKROUND } from '../../helpers/styles'
import { TASKS_FETCH_INTERVAL, TASKS_URL } from '../../constants'
import { logEvent, makeAuthorizedRequest, useInterval } from '../../helpers/utils'
import { setShowCalendarSidebar, setShowCreateTaskForm, setTasks, setTasksFetchStatus } from '../../redux/tasksPageSlice'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'

import CalendarSidebar from '../calendar/CalendarSidebar'
import ExpandCollapse from '../common/ExpandCollapse'
import Navbar from '../Navbar'
import { NavbarPages } from '../../helpers/types'
import TaskSection from './TaskSection'
import TaskStatus from './TaskStatus'
import styled from 'styled-components'
import { useDragDropManager } from 'react-dnd'
import { useFetchLinkedAccounts } from '../settings/Accounts'
import { useFetchSettings } from '../settings/Preferences'
import { Navigate, useParams } from 'react-router-dom'
import TaskSectionHeader from './TaskSectionHeader'
import RefreshButton from './RefreshButton'

const TasksPageContainer = styled.div`
    display:flex;
    height: 100%;
`
const TasksContentContainer = styled.div`
    flex: 1;
    display: flex;
    overflow: scroll;
    flex-direction: column;
    background-image: linear-gradient(${TASKS_BACKGROUND_GRADIENT}, ${TASKS_BACKROUND} 90%);
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
const BtnContainer = styled.div`
    position: absolute;
    right: 0;
    display: flex;
    justify-content: flex-end;
    height: 100%;
`
const NewTaskButton = styled.button`
    border: none;
    padding: 0;
    cursor: pointer;
    background-color: transparent;
`
const PlusImage = styled.img`
    height: 100%;
    width: 100%;
`
const TopBanner = styled.div`
    display: flex;
    justify-content: end;
    /* width: 100%; */
    margin-top: 24px;
    padding-right: 24px;    
`

export const useFetchTasks = (): () => Promise<void> => {
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
            dispatch(setTasksFetchStatus(FetchStatusEnum.ERROR))
            console.log({ e })
        }
    }, [])

    return fetchTasks
}

interface TasksProps {
    currentPage: NavbarPages
}
function Tasks({ currentPage }: TasksProps): JSX.Element {
    const task_sections = useAppSelector((state) => state.tasks_page.tasks.task_sections)
    const [currentSection, headerText, sectionIndex] = (() => {
        switch (currentPage) {
            case NavbarPages.TODAY_PAGE:
                return [task_sections[0], 'Today', 0]
            case NavbarPages.BLOCKED_PAGE:
                return [task_sections[1], 'Blocked', 1]
            case NavbarPages.BACKLOG_PAGE:
                return [task_sections[2], 'Backlog', 2]
            default:
                return [task_sections[0], 'Today', 0]
        }
    })()
    const fetchTasks = useFetchTasks()
    const fetchSettings = useFetchSettings()
    const fetchLinkedAccounts = useFetchLinkedAccounts()
    useEffect(() => {
        // fetch settings and linked accounts once on tasks page load
        fetchSettings()
        fetchLinkedAccounts()
    }, [])

    useInterval(fetchTasks, TASKS_FETCH_INTERVAL)
    const TaskSectionElement = <TaskSection
        task_section={currentSection}
        task_section_index={sectionIndex}
    />

    return (
        <TasksContentContainer>
            <TopBanner>
                <CollapseCalendarSidebar />
            </TopBanner>
            <Header>
                <HeaderText>
                    {headerText}
                </HeaderText>
                <RefreshButton />
                <CreateNewTaskButton />
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
        return <ExpandCollapse
            direction="left"
            onClick={() => dispatch(setShowCalendarSidebar(true))}
        />
    }
    else return <></>
})

function CreateNewTaskButton(): JSX.Element {
    const { showButton } = useAppSelector(state => ({
        showButton:
            state.tasks_page.tasks.task_sections.length !== 0 ||
            state.tasks_page.tasks.fetch_status !== FetchStatusEnum.LOADING
        ,
    }))
    const dispatch = useAppDispatch()

    const onClick = useCallback(() => {
        dispatch(setShowCreateTaskForm(true))
        logEvent(LogEvents.SHOW_TASK_CREATE_FORM)
    }, [])

    return (
        <BtnContainer>
            {showButton &&
                <NewTaskButton
                    onClick={onClick}>
                    <PlusImage src={`${process.env.PUBLIC_URL}/images/plus.svg`} alt="create new task" />
                </NewTaskButton>
            }
        </BtnContainer>
    )
}

export default function TasksPage(): JSX.Element {
    const calendarSidebarShown = useAppSelector((state) => state.tasks_page.events.show_calendar_sidebar)
    const section = `${useParams().section}_page`
    const currentPage = Object.values(NavbarPages).find(page => page === section)
    if (currentPage == null) return <Navigate to='/' />
    return (
        <TasksPageContainer>
            <Navbar currentPage={currentPage} />
            <Tasks currentPage={currentPage} />
            {calendarSidebarShown && <CalendarSidebar />}
        </TasksPageContainer>
    )
}

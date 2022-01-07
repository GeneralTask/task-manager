import React, { useCallback, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { AbortID, FetchStatusEnum, LogEvents } from '../../redux/enums'
import TaskSection from './TaskSection'
import TaskStatus from './TaskStatus'
import { setShowCreateTaskForm, setTasks, setTasksFetchStatus } from '../../redux/tasksPageSlice'
import styled from 'styled-components'
import { useFetchLinkedAccounts } from '../settings/Accounts'
import { useFetchSettings } from '../settings/Preferences'
import Navbar from '../Navbar'
import { NavbarPages } from '../../helpers/types'
import { TASKS_BACKGROUND_GRADIENT, TASKS_BACKROUND } from '../../helpers/styles'
import CalendarSidebar from '../calendar/CalendarSidebar'
import { useDragDropManager } from 'react-dnd'
import { TASKS_FETCH_INTERVAL, TASKS_URL } from '../../constants'
import { makeAuthorizedRequest, useInterval, logEvent } from '../../helpers/utils'

const TasksPageContainer = styled.div`
    display:flex;
    height: 100%;
`
const TasksContentContainer = styled.div`
    flex: 1;
    display: flex;
    overflow: scroll;
    padding-top: 50px;
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

function Tasks(): JSX.Element {
    const task_sections = useAppSelector((state) => state.tasks_page.tasks.task_sections)
    const fetchTasks = useFetchTasks()
    const fetchSettings = useFetchSettings()
    const fetchLinkedAccounts = useFetchLinkedAccounts()
    useEffect(() => {
        // fetch settings and linked accounts once on tasks page load
        fetchSettings()
        fetchLinkedAccounts()
    }, [])

    useInterval(fetchTasks, TASKS_FETCH_INTERVAL)

    const TaskSectionElements = task_sections.map(
        (task_section, index) => <TaskSection
            task_section={task_section}
            task_section_index={index}
            key={index}
        />
    )
    return (
        <TasksContentContainer>
            <Header>
                <HeaderText>
                    Tasks
                </HeaderText>
                <CreateNewTaskButton />
            </Header>
            <TaskStatus />
            {TaskSectionElements}
        </TasksContentContainer>
    )
}

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
                    <PlusImage src="images/plus.svg" alt="create new task"></PlusImage>
                </NewTaskButton>
            }
        </BtnContainer>
    )
}

export default function TasksPage(): JSX.Element {
    return (
        <TasksPageContainer>
            <Navbar currentPage={NavbarPages.TASKS_PAGE} />
            <Tasks />
            <CalendarSidebar />
        </TasksPageContainer>
    )
}

import React, { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { FetchStatusEnum } from '../../redux/enums'
import TaskSection from './TaskSection'
import TaskStatus from './TaskStatus'
import { setShowCreateTaskForm } from '../../redux/tasksPageSlice'
import styled from 'styled-components'
import { useFetchLinkedAccounts } from '../settings/Accounts'
import { useFetchSettings } from '../settings/Preferences'
import { useFetchTasks } from '../../helpers/utils'
import Navbar from '../Navbar'
import { NavbarPages } from '../../helpers/types'
import { TASKS_BACKROUND } from '../../helpers/styles'
import CalendarSidebar from '../calendar/CalendarSidebar'

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
    background-color: ${TASKS_BACKROUND};
`
const Header = styled.div`
    display: flex;
    margin-bottom: 24px;
    width: 60%;
    align-self: center;
    justify-content:center;
    position: relative;
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

export default function TasksPage(): JSX.Element {
    const task_sections = useAppSelector((state) => state.tasks_page.task_sections)
    const fetchTasks = useFetchTasks()
    const fetchSettings = useFetchSettings()
    const fetchLinkedAccounts = useFetchLinkedAccounts()
    useEffect(() => {
        // fetch settings and linked accounts once on tasks page load
        fetchSettings()
        fetchLinkedAccounts()

        fetchTasks()

        const interval: NodeJS.Timeout = setInterval(fetchTasks, 1000 * 60)
        return () => {
            clearInterval(interval)
        }
    }, [])

    const TaskSectionElements = task_sections.map(
        (task_section, index) => <TaskSection
            task_section={task_section}
            task_section_index={index}
            key={index}
        />
    )

    return (
        <TasksPageContainer>
            <Navbar currentPage={NavbarPages.TASKS_PAGE} />
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
            <CalendarSidebar />
        </TasksPageContainer>
    )
}

function CreateNewTaskButton(): JSX.Element {
    const { showButton } = useAppSelector(state => ({
        showButton:
            state.tasks_page.task_sections.length !== 0 ||
            state.tasks_page.tasks_fetch_status.status !== FetchStatusEnum.LOADING
        ,
    }))
    const dispatch = useAppDispatch()
    return (
        <BtnContainer>
            {showButton &&
                <NewTaskButton
                    onClick={() => {
                        dispatch(setShowCreateTaskForm(true))
                    }}>
                    <PlusImage src="images/plus.svg" alt="create new task"></PlusImage>
                </NewTaskButton>
            }
        </BtnContainer>
    )
}

import React, { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'

import { FetchStatusEnum } from '../../redux/enums'
import TaskSection from './TaskSection'
import TaskStatus from './TaskStatus'
import { device } from '../../helpers/styles'
import { setShowCreateTaskForm } from '../../redux/tasksPageSlice'
import styled from 'styled-components'
import { useFetchLinkedAccounts } from '../settings/Accounts'
import { useFetchSettings } from '../settings/Preferences'
import { useFetchTasks } from '../../helpers/utils'
import Navbar from '../Navbar'
import { NavbarPages } from '../../helpers/types'

const TasksPageContainer = styled.div`
    display:flex;
    height: 100%;
`
const Header = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: center;
    font-size: 32px; 
    margin: auto;
    margin-bottom: 24px;
    width: 70%;
    @media ${device.mobile}{
        width: 60%;
    }
`
const BtnContainer = styled.div`
    width: 10%;
    display: flex;
    justify-content: flex-end;
`
const NewTaskButton = styled.button`
    font-size: 40px;
    background: none;
    color: inherit;
    border: none;
    padding: 0;
    cursor: pointer;
    outline: inherit;
    font-weight: lighter;
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
            <div>
                <Header>
                    <BtnContainer />
                    Tasks
                    <CreateNewTaskButton />
                </Header>
                <TaskStatus />
                {TaskSectionElements}
            </div>
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
                    +
                </NewTaskButton>
            }
        </BtnContainer>
    )
}

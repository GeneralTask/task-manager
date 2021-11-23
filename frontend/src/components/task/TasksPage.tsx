import React, { useEffect } from 'react'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import store, { RootState } from '../../redux/store'
import TaskSection from './TaskSection'
import TaskStatus from './TaskStatus'
import { fetchLinkedAccounts } from '../settings/Accounts'
import { fetchSettings } from '../settings/Preferences'
import { fetchTasks } from '../../helpers/utils'
import styled from 'styled-components'
import { useSelector } from 'react-redux'
import GTButton from '../common/GTButton'
import { setShowCreateTaskForm } from '../../redux/actions'
import { device } from '../../helpers/styles'
import { FetchStatusEnum } from '../../redux/enums'

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

export default function TasksPage(): JSX.Element {
    const task_sections = useSelector((state: RootState) => state.tasks_page.task_sections)
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
        <DndProvider backend={HTML5Backend}>
            <Header>
                <BtnContainer />
                Tasks
                <CreateNewTaskButton />
            </Header>
            <TaskStatus />
            {TaskSectionElements}
        </DndProvider>
    )
}

function CreateNewTaskButton(): JSX.Element {
    const { showButton } = useSelector((state: RootState) => ({
        showButton: !(
            state.tasks_page.task_sections.length === 0 &&
            state.tasks_page.tasks_fetch_status.status === FetchStatusEnum.LOADING
        ),
    }))
    return (
        <BtnContainer>
            {showButton &&
                <GTButton
                    theme='light'
                    onClick={() => {
                        store.dispatch(setShowCreateTaskForm(true))
                    }}>
                    New
                </GTButton>}
        </BtnContainer>
    )
}

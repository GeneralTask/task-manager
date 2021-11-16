import React, { useEffect } from 'react'

import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { RootState } from '../../redux/store'
import TaskSection from './TaskSection'
import TaskStatus from './TaskStatus'
import { fetchLinkedAccounts } from '../settings/Accounts'
import { fetchSettings } from '../settings/Preferences'
import { fetchTasks } from '../../helpers/utils'
import styled from 'styled-components'
import { useSelector } from 'react-redux'

const Header = styled.div`
    text-align: center;
    font-size: 32px; 
    margin-bottom: 24px;
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
                Tasks
            </Header>
            <TaskStatus />
            {TaskSectionElements}
        </DndProvider>
    )
}

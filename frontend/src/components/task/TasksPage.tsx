import React, { useEffect } from 'react'
import { connect, useSelector } from 'react-redux'
import { fetchTasks } from '../../helpers/utils'
import { RootState } from '../../redux/store'

import TaskSection from './TaskSection'
import TaskStatus from './TaskStatus'
import _ from 'lodash'
import styled from 'styled-components'

const Header = styled.div`
    text-align: center;
    font-size: 32px; 
    margin-bottom: 24px;
`

function TasksPage(): JSX.Element {
    const task_sections = useSelector((state: RootState) => state.task_sections)
    useEffect(() => {
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
        <div>
            <Header>
                Tasks
            </Header>
            <TaskStatus />
            {TaskSectionElements}
        </div>
    )
}

export default connect(
    (state: RootState) => ({ task_sections: state.task_sections })
)(TasksPage)

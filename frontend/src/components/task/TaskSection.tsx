import { TTask, TTaskSection } from '../../helpers/types'

import React from 'react'
import TaskCreate from './TaskCreate'
import TaskSectionHeader from './TaskSectionHeader'
import { flex } from '../../helpers/styles'
import styled from 'styled-components'
import TaskDropContainer from './TaskDropContainer'

const TaskWrapperSides = styled.div`
    width: 22%;
`

interface Props {
    task_section: TTaskSection,
    task_section_index: number,
}

export default function TaskSection(props: Props): JSX.Element {
    const isToday = props.task_section.name === 'Today'
    return (
        <div>
            <TaskSectionHeader task_section_index={props.task_section_index} isToday={isToday} name={props.task_section.name} />
            {isToday && <TaskCreate />}
            {
                props.task_section.tasks.map((task: TTask, task_index: number) => {
                    return (
                        <div key={task_index}>
                            <flex.flex>
                                <TaskWrapperSides />
                            </flex.flex>
                            <TaskDropContainer
                                key={task.id}
                                task={task}
                                dragDisabled={false}
                                indices={{
                                    section: props.task_section_index,
                                    task: task_index,
                                }}
                            />
                        </div>
                    )
                })
            }
        </div>
    )
}

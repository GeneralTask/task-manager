import { TTask, TTaskSection } from '../../helpers/types'

import React from 'react'
import TaskCreate from './TaskCreate'
import { flex } from '../../helpers/styles'
import styled from 'styled-components'
import TaskDropContainer from './TaskDropContainer'

const TaskWrapperSides = styled.div`
    width: 22%;
`

interface Props {
    task_section: TTaskSection
    task_section_index: number
}

export default function TaskSection(props: Props): JSX.Element {
    return (
        <div>
            <TaskCreate task_section={props.task_section} task_section_index={props.task_section_index} />
            {props.task_section &&
                props.task_section.tasks &&
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
                })}
        </div>
    )
}

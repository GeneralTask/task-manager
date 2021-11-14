import { ScheduledTask, UnscheduledTaskGroup } from './TaskWrappers'
import { TTaskGroup, TTaskGroupType, TTaskSection } from '../../helpers/types'

import React from 'react'
import TaskCreate from './TaskCreate'
import TaskSectionHeader from './TaskSectionHeader'
import { flex } from '../../helpers/styles'
import styled from 'styled-components'

const TaskWrapperSides = styled.div`
    width: 22%;
`

interface TaskGroupProps {
    taskGroup: TTaskGroup,
    showTimeAnnotations: boolean,
}

function TaskGroup(props: TaskGroupProps) {
    if (props.taskGroup.type === TTaskGroupType.SCHEDULED_TASK) {
        return <ScheduledTask taskGroup={props.taskGroup} showTimeAnnotations={props.showTimeAnnotations} />
    }
    else if (props.taskGroup.type === TTaskGroupType.UNSCHEDULED_GROUP) {
        return <UnscheduledTaskGroup taskGroup={props.taskGroup} showTimeAnnotations={props.showTimeAnnotations} />
    }
    else {
        return null
    }
}

interface Props {
    task_section: TTaskSection,
    task_section_index: number,
}

export default function TaskSection(props: Props): JSX.Element {
    return <>
        <TaskSectionHeader task_section_index={props.task_section_index} isToday={props.task_section.is_today} name={props.task_section.name} />
        {props.task_section.is_today && <TaskCreate />}
        {
            props.task_section.task_groups.map((group: TTaskGroup, task_group_index: number) => {
                if (group.tasks && !group.tasks.length) {
                    return (<flex.flex key={task_group_index}>
                        <TaskWrapperSides />
                    </flex.flex>)
                }
                return (
                    <div key={task_group_index}>
                        {
                            group.tasks.length > 0 &&
                            <TaskGroup taskGroup={group}
                                showTimeAnnotations={props.task_section.is_today}
                            />
                        }
                    </div>
                )
            })
        }
    </>
}

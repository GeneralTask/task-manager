import { ScheduledTask, UnscheduledTaskGroup } from './TaskWrappers'
import { TTaskGroup, TTaskGroupType, TTaskSection } from '../../helpers/types'

import { Droppable } from 'react-beautiful-dnd'
import React from 'react'
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

function TaskGroup({ taskGroup, showTimeAnnotations }: TaskGroupProps) {
    if (taskGroup.type === TTaskGroupType.SCHEDULED_TASK) {
        return <ScheduledTask taskGroup={taskGroup} showTimeAnnotations={showTimeAnnotations} />
    }
    else if (taskGroup.type === TTaskGroupType.UNSCHEDULED_GROUP) {
        return <UnscheduledTaskGroup taskGroup={taskGroup} showTimeAnnotations={showTimeAnnotations} />
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
        <TaskSectionHeader show_current_time={props.task_section.is_today} name={props.task_section.name} />
        {
            props.task_section.task_groups.map((group: TTaskGroup, index: number) => {
                if (group.tasks && !group.tasks.length) {
                    return (<flex.flex key={index}>
                        <TaskWrapperSides />
                        <Droppable droppableId={`ts-${props.task_section_index}-tg-${index}`} isDropDisabled={group.type === TTaskGroupType.SCHEDULED_TASK}>
                            {provided => {
                                return <div ref={provided.innerRef} {...provided.droppableProps}>
                                    {provided.placeholder}
                                </div>
                            }}
                        </Droppable>
                    </flex.flex>)
                }
                else {
                    return (
                        <div key={index}>
                            <Droppable droppableId={`ts-${props.task_section_index}-tg-${index}`} isDropDisabled={group.type === TTaskGroupType.SCHEDULED_TASK}>
                                {provided => {
                                    return <div ref={provided.innerRef} {...provided.droppableProps}>
                                        {group.tasks.length > 0 &&
                                            <TaskGroup
                                                taskGroup={group}
                                                showTimeAnnotations={props.task_section.is_today}
                                            />}
                                        {provided.placeholder}
                                    </div>
                                }}
                            </Droppable>
                        </div>
                    )
                }
            })
        }
    </>
}

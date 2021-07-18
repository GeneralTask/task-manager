import React from 'react'
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd'
import styled from 'styled-components'
import { TASK_GROUP_SCHEDULED_TASK, TASK_GROUP_UNSCHEDULED_GROUP } from '../../constants'
import { flex, textDark } from '../../helpers/styles'
import { TTaskGroup, TTaskSection } from '../../helpers/types'
import { ScheduledTask, UnscheduledTaskGroup } from './TaskWrappers'

const TaskSectionTop = styled.div`
    display: flex;
`
const TimeAnnotation = styled.div`
    display: flex;
    color: ${textDark};
    width: 20%;
    margin-left: 10px;
    margin-right: 10px;
    font-size: 18px;
    font-weight: 600;
    align-items: flex-end;
    justify-content: flex-end;
    position: relative;
    top: 12px;
    margin-bottom: 10px;
`
const TaskSectionHeader = styled.div`
    margin: auto;
    font-size: 28px;
    height: 40px;
    text-align: center;
    width: 60%;
`
const TaskWrapperSides = styled.div`
    width: 22%;
`

interface TaskGroupProps {
    taskGroup: TTaskGroup,
}

function TaskGroup({ taskGroup }: TaskGroupProps) {
    if (taskGroup.type === TASK_GROUP_SCHEDULED_TASK) {
        return <ScheduledTask taskGroup={taskGroup} />
    }
    else if (taskGroup.type === TASK_GROUP_UNSCHEDULED_GROUP) {
        return <UnscheduledTaskGroup taskGroup={taskGroup} />
    }
    else {
        return null
    }
}

interface Props {
    task_section: TTaskSection,
    onDragStart: () => void,
    onDragEnd: (result: DropResult) => Promise<void>,
}

export default function TaskSection(props: Props): JSX.Element {
    return <>
        <TaskSectionHeader>{props.task_section.name}</TaskSectionHeader>
        <DragDropContext onDragStart={props.onDragStart} onDragEnd={props.onDragEnd}>
            {
                props.task_section.task_groups.map((group: TTaskGroup, index: number) => {
                    if (group.tasks && !group.tasks.length) {
                        return (<flex.flex key={index}>
                            <TaskWrapperSides />
                            <Droppable droppableId={`ts-0-tg-${index}`} isDropDisabled={group.type === TASK_GROUP_SCHEDULED_TASK}>
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
                                <Droppable droppableId={`ts-0-tg-${index}`} isDropDisabled={group.type === TASK_GROUP_SCHEDULED_TASK}>
                                    {provided => {
                                        return <div ref={provided.innerRef} {...provided.droppableProps}>
                                            {group.tasks.length > 0 && <TaskGroup taskGroup={group} />}
                                            {provided.placeholder}
                                        </div>
                                    }}
                                </Droppable>
                            </div>
                        )
                    }
                }
                )
            }
        </DragDropContext>
    </>
}

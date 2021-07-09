import { DragDropContext, DropResult, Droppable } from 'react-beautiful-dnd'
import React, { useEffect } from 'react'
import { ScheduledTask, UnscheduledTaskGroup } from './TaskWrappers'
import { TASKS_URL, TASK_GROUP_SCHEDULED_TASK, TASK_GROUP_UNSCHEDULED_GROUP } from '../../constants'
import { TTask, TTaskGroup } from '../../helpers/types'
import { connect, useSelector } from 'react-redux'
import { makeAuthorizedRequest, resetOrderingIds } from '../../helpers/utils'
import { setTasks, setTasksFetchStatus } from '../../redux/actions'

import { FetchStatus } from '../../redux/enums'
import { RootState } from '../../redux/store'
import TaskStatus from './TaskStatus'
import _ from 'lodash'
import store from '../../redux/store'
import styled from 'styled-components'

const MyTasks = styled.h1`
    text-align: center;
    margin-top: 0;
`

interface TaskGroupProps {
    taskGroup: TTaskGroup,
}

const fetchTasks = async () => {
    store.dispatch(setTasksFetchStatus(FetchStatus.LOADING))
    try {
        const response = await makeAuthorizedRequest({
            url: TASKS_URL,
            method: 'GET',
        })
        if (!response.ok) {
            throw new Error('/tasks api call failed')
        }
        else {
            const resj = await response.json()
            store.dispatch(setTasksFetchStatus(FetchStatus.SUCCESS))
            store.dispatch(setTasks(resj))
        }
    }
    catch (e) {
        store.dispatch(setTasksFetchStatus(FetchStatus.ERROR))
        console.log({ e })
    }
}

const TaskList: React.FC = () => {
    const task_groups = useSelector((state: RootState) => state.task_groups)
    let task_counter = 0
    useEffect(() => {
        fetchTasks()
        const interval: NodeJS.Timeout = setInterval(fetchTasks, 1000 * 60)
        return () => {
            clearInterval(interval)
        }
    }, [])

    function TaskGroup({ taskGroup }: TaskGroupProps) {
        if (taskGroup.type === TASK_GROUP_SCHEDULED_TASK) {
            return <ScheduledTask taskGroup={taskGroup} index={task_counter++} />
        }
        else if (taskGroup.type === TASK_GROUP_UNSCHEDULED_GROUP) {
            return <UnscheduledTaskGroup taskGroup={taskGroup} index={task_counter++} />
        }
        else {
            return null
        }
    }

    function onDragEnd(result: DropResult) {
        const { destination, source } = result

        if (!destination || !source || destination.index === source.index) return

        const source_index: number = parseInt(source.droppableId.slice(-1))
        const destination_index: number = parseInt(destination.droppableId.slice(-1))

        // makes deep copy to keep redux state intact
        const task_groups_copy: TTaskGroup[] = _.cloneDeep(task_groups)
        const source_group: TTaskGroup = task_groups_copy[source_index]
        const dest_group: TTaskGroup = task_groups_copy[destination_index]
        const source_task: TTask = source_group.tasks[source.index]

        source_group.tasks.splice(source.index, 1)
        dest_group.tasks.splice(destination.index, 0, source_task)

        resetOrderingIds(task_groups_copy)

        store.dispatch(setTasks(task_groups_copy))

        const reorderedTask: TTask = task_groups_copy[destination_index].tasks[destination.index]

        makeAuthorizedRequest({
            url: TASKS_URL + reorderedTask.id + '/',
            method: 'PATCH',
            body: JSON.stringify({
                id_ordering: reorderedTask.id_ordering,
            })
        })
    }

    return (
        <div>
            <MyTasks>My Tasks</MyTasks>
            <TaskStatus />
            <DragDropContext onDragEnd={onDragEnd}>
                {
                    task_groups.map((group: TTaskGroup, index: number) =>
                        <div key={index}>
                            <Droppable droppableId={`list-${index}`} isDropDisabled={group.type === TASK_GROUP_SCHEDULED_TASK}>
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
            </DragDropContext>
        </div>
    )
}

export default connect(
    (state: RootState) => ({ task_groups: state.task_groups })
)(TaskList)

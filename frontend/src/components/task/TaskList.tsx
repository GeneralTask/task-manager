import React, { useEffect } from 'react'
import { connect, useSelector } from 'react-redux'
import store from '../../redux/store'
import { setTasks, setTasksFetchStatus } from '../../redux/actions'
import { FetchStatus } from '../../redux/enums'
import { TASKS_URL, TASK_GROUP_SCHEDULED_TASK, TASK_GROUP_UNSCHEDULED_GROUP } from '../../constants'
import { ScheduledTask, UnscheduledTaskGroup } from './TaskWrappers'
import TaskStatus from './TaskStatus'
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd'
import styled from 'styled-components'
import { makeAuthorizedRequest, resetOrderingIds } from '../../helpers/utils'
import { TTaskGroup, TTask } from '../../helpers/types'
import { RootState } from '../../redux/store'
import _ from 'lodash'

const MyTasks = styled.h1`
    height: 40px;
    text-align: center;
`

interface TaskGroupProps {
    taskGroup: TTaskGroup,
    index: number,
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
        const timer = setInterval(fetchTasks, 1000)
        console.log('wut')
        // let timer: NodeJS.Timeout
        // timer = setInterval(() => fetchTasks, 1000)
        // }
        return () => {
            clearInterval(timer)
        }
    }, [task_groups])

    function TaskGroup({ taskGroup, index }: TaskGroupProps) {
        // if currently in a task group, estimate time left until end of task group
        // else display the duration of that task

        if (taskGroup.type === TASK_GROUP_SCHEDULED_TASK) {
            if (taskGroup.tasks.length !== 0) {
                return <ScheduledTask taskGroup={taskGroup} index={task_counter++} />
            }
        }
        else if (taskGroup.type === TASK_GROUP_UNSCHEDULED_GROUP) {
            return <UnscheduledTaskGroup taskGroup={taskGroup} index={task_counter++} />
        }
        return null
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
    const firstTaskFound = false
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
                                        <TaskGroup taskGroup={group} index={index} />
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

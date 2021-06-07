import React, { useEffect } from 'react'
import { connect, useSelector } from 'react-redux'
import store from '../../redux/store'
import {setTasks, setTasksFetchStatus} from '../../redux/actions'
import { FetchStatus } from '../../redux/enums'
import { TASKS_URL, TASK_GROUP_SCHEDULED_TASK, TASK_GROUP_UNSCHEDULED_GROUP } from '../../constants'
import {ScheduledTask, UnscheduledTaskGroup} from './TaskWrappers'
import TaskStatus from './TaskStatus'
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd'
import moment from 'moment'
import styled from 'styled-components'
import {makeAuthorizedRequest, resetOrderingIds} from '../../helpers/utils'
import { TTaskGroup, TTask } from '../../helpers/types'
import { RootState } from '../../redux/store'
import _ from 'lodash'

const MyTasks = styled.h1`
    height: 40px;
    text-align: center;
`

const fetchTasks = async () => {
    store.dispatch(setTasksFetchStatus(FetchStatus.LOADING))
    try{
        const response = await makeAuthorizedRequest({
            url: TASKS_URL,
            method: 'GET',
        })
        if(!response.ok){
            throw new Error('/tasks api call failed')
        }
        else{
            const resj = await response.json()
            store.dispatch(setTasksFetchStatus(FetchStatus.SUCCESS))
            store.dispatch(setTasks(resj))
        }
    }
    catch(e){
        store.dispatch(setTasksFetchStatus(FetchStatus.ERROR))
        console.log({e})
    }
}

const TaskList: React.FC = () => {
    const task_groups = useSelector((state: RootState) => state.task_groups)
    let task_counter = 0

    useEffect(() => {
        setInterval(fetchTasks, 1000 * 60)
        fetchTasks()
    }, [])

    
    function renderTaskGroup(taskGroup: TTaskGroup, index: number) {
        let next_time = null
        if(index === 0 && task_groups.length > 1){
            next_time = moment(task_groups[1].datetime_start)
        }
        if(taskGroup.type === TASK_GROUP_SCHEDULED_TASK){
            if(taskGroup.tasks.length !== 0){
                return <ScheduledTask task={taskGroup.tasks[0]} key={index} time_duration={taskGroup.time_duration} 
                    next_time={!next_time ? null : next_time} datetime_start={taskGroup.datetime_start} index={task_counter++}/>
            }
        }
        else if(taskGroup.type === TASK_GROUP_UNSCHEDULED_GROUP){
            return <UnscheduledTaskGroup tasks={taskGroup.tasks} key={index} time_duration={taskGroup.time_duration} 
                next_time={!next_time ? null : next_time} index={task_counter++}/>
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
            <TaskStatus/>
            <DragDropContext onDragEnd={onDragEnd}>
                { 
                    task_groups.map((group: TTaskGroup, index: number) =>
                        <div>
                            <Droppable droppableId={`list-${index}`} isDropDisabled={group.type === TASK_GROUP_SCHEDULED_TASK}>
                                {provided => (
                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                        {renderTaskGroup(group, index)}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    )
                }
            </DragDropContext>
        </div>
    )
}



export default connect(
    (state: RootState) => ({task_groups: state.task_groups})
)(TaskList)

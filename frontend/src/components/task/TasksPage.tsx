import '../../helpers/components/dot-spinner.css'

import { DragDropContext, DropResult } from 'react-beautiful-dnd'
import React, { useEffect } from 'react'
import { TTask, TTaskGroup, TTaskSection } from '../../helpers/types'
import { connect, useSelector } from 'react-redux'
import { fetchTasks, makeAuthorizedRequest, resetOrderingIds } from '../../helpers/utils'
import { setTasks, setTasksDragState } from '../../redux/actions'
import store, { RootState } from '../../redux/store'

import { DragState } from '../../redux/enums'
import { TASKS_MODIFY_URL } from '../../constants'
import TaskSection from './TaskSection'
import TaskStatus from './TaskStatus'
import _ from 'lodash'
import styled from 'styled-components'

const Header = styled.div`
    text-align: center;
    font-size: 32px; 
    margin-bottom: 24px;
`

function onDragStart(): void {
    setTasksDragState(DragState.isDragging)
}

async function onDragEnd(result: DropResult) {
    const { destination, source } = result
    // destination.index is the index of the task in the *entire list*
    if (!destination || !source || result.type === 'CANCEL') return

    const sourceDroppableIDSplit = source.droppableId.split('-')
    const destDroppableIDSplit = destination.droppableId.split('-')

    const source_task_section_index = parseInt(sourceDroppableIDSplit[1])
    const destination_task_section_index = parseInt(destDroppableIDSplit[1])

    const source_task_group_index = parseInt(sourceDroppableIDSplit[3])
    const destination_task_group_index = parseInt(destDroppableIDSplit[3])

    // makes deep copy to keep redux state intact
    const task_sections_copy: TTaskSection[] = _.cloneDeep(store.getState().task_sections)

    const source_section: TTaskSection = task_sections_copy[source_task_section_index]
    const dest_section: TTaskSection = task_sections_copy[destination_task_section_index]

    const source_group: TTaskGroup = source_section.task_groups[source_task_group_index]
    const dest_group: TTaskGroup = dest_section.task_groups[destination_task_group_index]

    const source_task: TTask = source_group.tasks[source.index]

    source_group.tasks.splice(source.index, 1)
    dest_group.tasks.splice(destination.index, 0, source_task)

    resetOrderingIds(task_sections_copy)

    store.dispatch(setTasks(task_sections_copy))

    const reorderedTask: TTask = task_sections_copy[destination_task_section_index].task_groups[destination_task_group_index].tasks[destination.index]

    await makeAuthorizedRequest({
        url: TASKS_MODIFY_URL + reorderedTask.id + '/',
        method: 'PATCH',
        body: JSON.stringify({
            id_task_section: task_sections_copy[destination_task_section_index].id,
            id_ordering: reorderedTask.id_ordering,
        })
    })

    if (store.getState().tasks_drag_state == DragState.fetchDelayed) {
        await fetchTasks()
    }
    setTasksDragState(DragState.noDrag)
}

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
        <>
            <Header>
                Tasks
            </Header>
            <TaskStatus />
            <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
                {TaskSectionElements}
            </DragDropContext>
        </>
    )
}

export default connect(
    (state: RootState) => ({ task_sections: state.task_sections })
)(TasksPage)

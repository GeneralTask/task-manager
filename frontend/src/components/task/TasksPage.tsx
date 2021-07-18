import _ from 'lodash'
import React, { useEffect } from 'react'
import { DropResult } from 'react-beautiful-dnd'
import { connect, useSelector } from 'react-redux'
import { TTask, TTaskGroup, TTaskSection } from '../../helpers/types'
import { fetchTasks } from '../../helpers/utils'
import { setTasksDragState } from '../../redux/actions'
import { DragState } from '../../redux/enums'
import store, { RootState } from '../../redux/store'
import TaskSection from './TaskSection'

function onDragStart(): void {
    setTasksDragState(DragState.isDragging)
}

async function onDragEnd(result: DropResult) {
    // will finish next PR
    setTasksDragState(DragState.noDrag)
    return
    // const { destination, source } = result
    // // destination.index is the index of the task in the *entire list*
    // if (!destination || !source || result.type === 'CANCEL') return

    // const sourceDroppableIDSplit = source.droppableId.split('-')
    // const destDroppableIDSplit = destination.droppableId.split('-')

    // const source_task_section_index = parseInt(sourceDroppableIDSplit[1])
    // const destination_task_section_index = parseInt(destDroppableIDSplit[1])

    // const source_task_group_index = parseInt(sourceDroppableIDSplit[3])
    // const destination_task_group_index = parseInt(destDroppableIDSplit[3])

    // // makes deep copy to keep redux state intact
    // const task_sections_copy: TTaskSection[] = _.cloneDeep(store.getState().task_sections)

    // const source_section: TTaskSection = task_sections_copy[source_task_section_index]
    // const dest_section: TTaskSection = task_sections_copy[destination_task_section_index]

    // const source_group: TTaskGroup = source_section.task_groups[source_task_group_index]
    // const dest_group: TTaskGroup = dest_section.task_groups[destination_task_group_index]

    // const source_task: TTask = source_group.tasks[source.index]

    // source_group.tasks.splice(source.index, 1)
    // dest_group.tasks.splice(destination.index, 0, source_task)

    // resetOrderingIds(task_groups_copy)

    // store.dispatch(setTasks(task_groups_copy))

    // const reorderedTask: TTask = task_groups_copy[destination_task_group_index].tasks[destination.index]

    // await makeAuthorizedRequest({
    //     url: TASKS_URL + reorderedTask.id + '/',
    //     method: 'PATCH',
    //     body: JSON.stringify({
    //         id_ordering: reorderedTask.id_ordering,
    //     })
    // })

    // if (dragState == DragState.fetchDelayed) {
    //     await fetchTasks()
    // }
    // dragState = DragState.noDrag
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
            key={index}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        />
    )

    return (
        <>
            {TaskSectionElements}
        </>
    )
}

export default connect(
    (state: RootState) => ({ task_sections: state.task_sections })
)(TasksPage)
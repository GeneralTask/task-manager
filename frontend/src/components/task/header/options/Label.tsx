import React from 'react'
import { TASKS_MODIFY_URL, LABEL_ICON } from '../../../../constants'
import { TTask } from '../../../../helpers/types'
import { sectionDropReorder, makeAuthorizedRequest } from '../../../../helpers/utils'
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks'
import { hideLabelSelector, setTasks } from '../../../../redux/tasksPageSlice'
import { useFetchTasks } from '../../TasksPage'

import { LabelContainer, LabelHeader, LabelIcon, LabelOption } from './Label-style'

interface LabelProps {
    task: TTask
}

export default function Label({ task }: LabelProps): JSX.Element {
    const dispatch = useAppDispatch()
    const fetchTasks = useFetchTasks()

    const { taskSections } = useAppSelector((state) => ({
        taskSections: state.tasks_page.tasks.task_sections,
    }))

    const currentTaskSectionIndex = taskSections.findIndex((s) => s.tasks?.includes(task))

    return (
        <LabelContainer onClick={e => e.stopPropagation()} >
            <LabelHeader>Edit Label</LabelHeader>
            {
                taskSections.map((newSection, newSectionIndex) => {
                    if (newSectionIndex === currentTaskSectionIndex || taskSections[newSectionIndex].is_done) return
                    return (
                        <LabelOption key={newSectionIndex} onClick={
                            (e) => {
                                e.stopPropagation()

                                const newTaskSections = sectionDropReorder(taskSections, newSectionIndex, {
                                    task: task.id_ordering - 1,
                                    section: currentTaskSectionIndex,
                                })
                                dispatch(setTasks(newTaskSections))
                                dispatch(hideLabelSelector())

                                const patchBody = JSON.stringify({
                                    id_task_section: newSection.id,
                                    id_ordering: newTaskSections[newSectionIndex].tasks[0].id_ordering,
                                })

                                makeAuthorizedRequest({
                                    url: TASKS_MODIFY_URL + task.id + '/',
                                    method: 'PATCH',
                                    body: patchBody,
                                })
                                    .then(fetchTasks)
                                    .catch((error) => {
                                        throw new Error('PATCH /tasks/ failed' + error)
                                    })
                            }
                        }>
                            <LabelIcon src={LABEL_ICON} />
                            {newSection.name}
                        </LabelOption>
                    )
                })
            }
        </LabelContainer>
    )
}

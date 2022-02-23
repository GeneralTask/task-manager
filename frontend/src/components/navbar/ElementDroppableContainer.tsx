import { ReactElement, RefObject, useRef } from 'react'
import { useDrop } from 'react-dnd'
import styled from 'styled-components'
import { TASKS_MODIFY_URL } from '../../constants'
import { NavbarPage } from '../../helpers/enums'
import { BACKGROUND_HOVER, BORDER_PRIMARY } from '../../helpers/styles'
import { TTaskSection, ItemTypes, Indices } from '../../helpers/types'
import { navbarDropReorder, makeAuthorizedRequest } from '../../helpers/utils'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setTasks } from '../../redux/tasksPageSlice'
import { useGetTasks } from '../task/TasksPage'
import React from 'react'

const ElementDroppableDiv = styled.div<{
    isCurrentPage: boolean
    isOverDroppable: boolean
}>`
    width: 92.5%;
    display: flex;
    background-color: ${(props) => (props.isCurrentPage ? BACKGROUND_HOVER : 'inherit')};
    border-radius: 10px;
    margin-bottom: 10px;
    background-color: ${(props) => (props.isCurrentPage ? 'rgba(24, 24, 27, 0.04)' : 'inherit')};
    &:hover {
        background-color: ${BACKGROUND_HOVER};
    }
    border-width: medium;
    border-style: solid;
    border-color: ${(props) => (props.isOverDroppable ? BORDER_PRIMARY : 'transparent')};
`
interface ElementDroppableContainerProps {
    children: ReactElement
    page: NavbarPage
    isCurrentPage: boolean
}

const ElementDroppableContainer = (props: ElementDroppableContainerProps): JSX.Element => {
    const getTasks = useGetTasks()
    const { taskSections } = useAppSelector((state) => ({
        taskSections: state.tasks_page.tasks.task_sections,
    }))
    const taskSectionsRef = useRef<TTaskSection[]>()
    taskSectionsRef.current = taskSections

    const dispatch = useAppDispatch()
    const [{ isOverDroppable }, drop] = useDrop(() => ({
        accept: ItemTypes.TASK,
        collect: (monitor) => ({
            isOverDroppable:
                monitor.isOver() &&
                props.page !== NavbarPage.DONE_PAGE &&
                props.page !== NavbarPage.MESSAGES_PAGE &&
                props.page !== NavbarPage.SETTINGS_PAGE &&
                props.page !== NavbarPage.LOGOUT,
        }),
        drop: (item: { id: string; indicesRef: RefObject<Indices> }) => {
            if (
                props.page === NavbarPage.DONE_PAGE ||
                props.page === NavbarPage.MESSAGES_PAGE ||
                props.page === NavbarPage.SETTINGS_PAGE ||
                props.page === NavbarPage.LOGOUT
            )
                return
            if (item.indicesRef.current == null) return
            if (taskSectionsRef.current == null) return

            let updatedTaskSections: TTaskSection[]
            let taskSectionIndex: number
            switch (props.page) {
                case NavbarPage.TODAY_PAGE:
                    updatedTaskSections = navbarDropReorder(taskSectionsRef.current, 0, item.indicesRef.current)
                    dispatch(setTasks(updatedTaskSections))
                    taskSectionIndex = 0
                    break
                case NavbarPage.BLOCKED_PAGE:
                    updatedTaskSections = navbarDropReorder(taskSectionsRef.current, 1, item.indicesRef.current)
                    dispatch(setTasks(updatedTaskSections))
                    taskSectionIndex = 1
                    break
                case NavbarPage.BACKLOG_PAGE:
                    updatedTaskSections = navbarDropReorder(taskSectionsRef.current, 2, item.indicesRef.current)
                    dispatch(setTasks(updatedTaskSections))
                    taskSectionIndex = 2
                    break
                default:
                    updatedTaskSections = taskSectionsRef.current
                    taskSectionIndex = 0
                    break
            }
            const patchBody = JSON.stringify({
                id_task_section: taskSectionsRef.current[taskSectionIndex].id,
                id_ordering: updatedTaskSections[taskSectionIndex].tasks[0].id_ordering,
            })
            makeAuthorizedRequest({
                url: TASKS_MODIFY_URL + item.id + '/',
                method: 'PATCH',
                body: patchBody,
            })
                .then(getTasks)
                .catch((error) => {
                    throw new Error('PATCH /tasks/ failed' + error)
                })
        },
    }))
    return (
        <ElementDroppableDiv ref={drop} isCurrentPage={props.isCurrentPage} isOverDroppable={isOverDroppable}>
            {props.children}
        </ElementDroppableDiv>
    )
}

export default ElementDroppableContainer

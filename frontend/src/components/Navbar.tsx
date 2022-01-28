import React, { ReactElement, RefObject, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { MESSAGES_PATH, SETTINGS_PATH, TASKS_MODIFY_URL } from '../constants'
import { Indices, ItemTypes, TTaskSection } from '../helpers/types'
import { NavbarPages } from '../helpers/enums'
import { logout, makeAuthorizedRequest, navbarDropReorder } from '../helpers/utils'
import { useAppDispatch, useAppSelector } from '../redux/hooks'
import { setTasks } from '../redux/tasksPageSlice'
import { useFetchTasks } from './task/TasksPage'
import {
    BACKGROUND_HOVER,
    BORDER_PRIMARY,
    flex,
    SHADOW_PRIMARY,
    TASKS_BACKGROUND_GRADIENT,
    TASKS_BACKROUND,
    TEXT_BLACK,
    TEXT_GRAY,
} from '../helpers/styles'

const NavbarContainer = styled.div`
    flex: 0 0 275px;
    background-image: linear-gradient(to bottom right, ${TASKS_BACKGROUND_GRADIENT}, ${TASKS_BACKROUND} 90%);
    color: white;
    height: 100%;
    z-index: 1;
    box-shadow: ${SHADOW_PRIMARY};
`

const NavbarList = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
`
const NavbarItemDroppableDiv = styled.div<{
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
const NavbarListItem = styled.div`
    display: flex;
    width: 100%;
`
const NavbarLink = styled(Link)`
    width: 100%;
    height: 100%;
    cursor: pointer;
    text-decoration: none;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`
const NavbarItemCount = styled.span`
    font-weight: bold;
    font-size: 16px;
    letter-spacing: 0.01em;
    padding-right: 10px;
    color: ${TEXT_GRAY};
`
const NavbarLogout = styled.div`
    width: 100%;
    height: 100%;
    cursor: pointer;
`
const NavbarLinkButton = styled.button<{ isCurrentPage: boolean }>`
    font-style: normal;
    font-weight: ${(props) => (props.isCurrentPage ? '600' : 'normal')};
    font-size: 20px;
    letter-spacing: 0.01em;
    background-color: inherit;
    height: 45px;
    color: ${(props) => (props.isCurrentPage ? TEXT_BLACK : TEXT_GRAY)};
    border: none;
    padding-left: 10px;
    cursor: pointer;
`
const Icon = styled.img`
    width: 48px;
    height: 48px;
    padding: 1em;
`

const NavbarHeader = (): JSX.Element => {
    return (
        <flex.flex>
            <Icon src={`${process.env.PUBLIC_URL}/images/Logo.svg`} />
        </flex.flex>
    )
}
interface NavbarItemDroppableContainerProps {
    children: ReactElement<typeof NavbarElements>
    page: NavbarPages
    isCurrentPage: boolean
}

const NavbarItemDroppableContainer = (props: NavbarItemDroppableContainerProps): JSX.Element => {
    const fetchTasks = useFetchTasks()
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
                monitor.isOver() && props.page !== NavbarPages.MESSAGES_PAGE && props.page !== NavbarPages.SETTINGS_PAGE && props.page !== NavbarPages.LOGOUT,
        }),
        drop: (item: { id: string; indicesRef: RefObject<Indices> }) => {
            if (props.page === NavbarPages.MESSAGES_PAGE || props.page === NavbarPages.SETTINGS_PAGE || props.page === NavbarPages.LOGOUT) return
            if (item.indicesRef.current == null) return
            if (taskSectionsRef.current == null) return

            let updatedTaskSections: TTaskSection[]
            let taskSectionIndex: number
            switch (props.page) {
                case NavbarPages.TODAY_PAGE:
                    updatedTaskSections = navbarDropReorder(taskSectionsRef.current, 0, item.indicesRef.current)
                    dispatch(setTasks(updatedTaskSections))
                    taskSectionIndex = 0
                    break
                case NavbarPages.BLOCKED_PAGE:
                    updatedTaskSections = navbarDropReorder(taskSectionsRef.current, 1, item.indicesRef.current)
                    dispatch(setTasks(updatedTaskSections))
                    taskSectionIndex = 1
                    break
                case NavbarPages.BACKLOG_PAGE:
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
                .then(fetchTasks)
                .catch((error) => {
                    throw new Error('PATCH /tasks/ failed' + error)
                })
        },
    }))
    return (
        <NavbarItemDroppableDiv ref={drop} isCurrentPage={props.isCurrentPage} isOverDroppable={isOverDroppable}>
            {props.children}
        </NavbarItemDroppableDiv>
    )
}

interface NavbarProps {
    currentPage: NavbarPages
}

const NavbarElements = ({ currentPage }: NavbarProps): JSX.Element => {
    const linkElements: {
        page: NavbarPages
        link: ReactElement<typeof Link>
    }[] = [
            {
                page: NavbarPages.TODAY_PAGE,
                link: (
                    <NavbarLink to={'/tasks/today'}>
                        <NavbarLinkButton isCurrentPage={currentPage === NavbarPages.TODAY_PAGE}>Today</NavbarLinkButton>
                        <NavbarItemCount> </NavbarItemCount>
                    </NavbarLink>
                ),
            },
            {
                page: NavbarPages.BLOCKED_PAGE,
                link: (
                    <NavbarLink to={'/tasks/blocked'}>
                        <NavbarLinkButton isCurrentPage={currentPage === NavbarPages.BLOCKED_PAGE}>
                            Blocked
                        </NavbarLinkButton>
                        <NavbarItemCount> </NavbarItemCount>
                    </NavbarLink>
                ),
            },
            {
                page: NavbarPages.BACKLOG_PAGE,
                link: (
                    <NavbarLink to={'/tasks/backlog'}>
                        <NavbarLinkButton isCurrentPage={currentPage === NavbarPages.BACKLOG_PAGE}>
                            Backlog
                        </NavbarLinkButton>
                        <NavbarItemCount> </NavbarItemCount>
                    </NavbarLink>
                ),
            },
            {
                page: NavbarPages.MESSAGES_PAGE,
                link: (
                    <NavbarLink to={MESSAGES_PATH}>
                        <NavbarLinkButton isCurrentPage={currentPage === NavbarPages.MESSAGES_PAGE}>
                            Messages
                        </NavbarLinkButton>
                        <NavbarItemCount> </NavbarItemCount>
                    </NavbarLink>
                ),
            },
            {
                page: NavbarPages.SETTINGS_PAGE,
                link: (
                    <NavbarLink to={SETTINGS_PATH}>
                        <NavbarLinkButton isCurrentPage={currentPage === NavbarPages.SETTINGS_PAGE}>
                            Settings
                        </NavbarLinkButton>
                    </NavbarLink>
                ),
            },
            {
                page: NavbarPages.LOGOUT,
                link: (
                    <NavbarLogout onClick={logout}>
                        <NavbarLinkButton isCurrentPage={currentPage === NavbarPages.LOGOUT}>Logout</NavbarLinkButton>
                    </NavbarLogout>
                ),
            },
        ]
    const navbarJSXElements = linkElements.map((element) => (
        <NavbarItemDroppableContainer
            key={element.page}
            page={element.page}
            isCurrentPage={currentPage === element.page}
        >
            <NavbarListItem>{element.link}</NavbarListItem>
        </NavbarItemDroppableContainer>
    ))
    return <NavbarList>{navbarJSXElements}</NavbarList>
}

const Navbar = ({ currentPage }: NavbarProps): JSX.Element => (
    <NavbarContainer>
        <NavbarHeader />
        <NavbarElements currentPage={currentPage} />
    </NavbarContainer>
)

export default Navbar

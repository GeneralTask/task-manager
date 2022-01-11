import React, { ReactElement, RefObject, useRef } from 'react'
import { useDrop } from 'react-dnd'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { LANDING_PATH, SETTINGS_PATH, TASKS_MODIFY_URL } from '../constants'
import { UNSELECTED_NAVBAR_COLOR } from '../helpers/styles'
import { Indices, ItemTypes, NavbarPages, TTaskSection } from '../helpers/types'
import { logout, makeAuthorizedRequest, navbarDropReorder } from '../helpers/utils'
import { useAppDispatch, useAppSelector } from '../redux/hooks'
import { setTasks } from '../redux/tasksPageSlice'
import { useFetchTasks } from './task/TasksPage'

const NavbarContainer = styled.div`
    flex: 0 0 275px;
    background-color: #27272A;
    color: white;
    height: 100%;
`

const NavbarList = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    margin-top: 40px;
`
const NavbarItemDroppableDiv = styled.div<{ isCurrentPage: boolean, isOverDroppable: boolean }>`
    width: 92.5%;
    border-radius: 10px;
    margin-bottom: 10px;
    background-color: ${props => props.isCurrentPage ? '#3F3F46' : 'inherit'};
    &:hover {
        background-color: #3F3F46;
    }
    border-width: medium;
    border-style: solid;
    border-color: ${props => props.isOverDroppable ? 'white' : '#27272A'};
`
const NavbarListItem = styled.div`
    display: flex;
`
const NavbarLink = styled(Link)`
    width: 100%;
    height: 100%;
    cursor: pointer;
`
const NavbarLinkButton = styled.button<{ isCurrentPage: boolean }>`
    font-style: normal;
    font-weight: ${props => props.isCurrentPage ? '600' : 'normal'};
    font-size: 20px;
    letter-spacing: 0.01em;
    background-color: inherit;
    height: 45px;
    color: ${props => props.isCurrentPage ? 'white' : UNSELECTED_NAVBAR_COLOR};;
    border: none;
    padding-left: 10px;
    cursor: pointer;
`
interface NavbarItemDroppableContainerProps {
    children: ReactElement<typeof NavbarElements>,
    page: NavbarPages,
    isCurrentPage: boolean,
}

const NavbarItemDroppableContainer = (props: NavbarItemDroppableContainerProps): JSX.Element => {
    const fetchTasks = useFetchTasks()
    const { taskSections } = useAppSelector(state => ({
        taskSections: state.tasks_page.tasks.task_sections,
    }))
    const taskSectionsRef = useRef<TTaskSection[]>()
    taskSectionsRef.current = taskSections


    const dispatch = useAppDispatch()
    const [{ isOverDroppable }, drop] = useDrop(() => ({
        accept: ItemTypes.TASK,
        collect: monitor => ({
            isOverDroppable: monitor.isOver() && (props.page !== NavbarPages.SETTINGS_PAGE && props.page !== NavbarPages.LOGOUT),
        }),
        drop: (item: { id: string, indicesRef: RefObject<Indices> }) => {
            if (props.page === NavbarPages.SETTINGS_PAGE || props.page === NavbarPages.LOGOUT) return
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
                id_ordering: updatedTaskSections[taskSectionIndex].tasks[0].id_ordering
            })
            makeAuthorizedRequest({
                url: TASKS_MODIFY_URL + item.id + '/',
                method: 'PATCH',
                body: patchBody,
            }).then(fetchTasks).catch((error) => {
                throw new Error('PATCH /tasks/ failed' + error)
            })
        }
    }))
    return (
        <NavbarItemDroppableDiv ref={drop} isCurrentPage={props.isCurrentPage} isOverDroppable={isOverDroppable} >
            {props.children}
        </NavbarItemDroppableDiv>
    )
}

interface NavbarProps {
    currentPage: NavbarPages
}

const NavbarElements = ({ currentPage }: NavbarProps): JSX.Element => {
    const linkElements: {
        page: NavbarPages,
        link: ReactElement<typeof Link>
    }[] = [
            {
                page: NavbarPages.TODAY_PAGE,
                link: (
                    <NavbarLink to={'/tasks/today'}>
                        <NavbarLinkButton isCurrentPage={currentPage === NavbarPages.TODAY_PAGE}>
                            Today
                        </NavbarLinkButton>
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
                    <NavbarLink to={LANDING_PATH} onClick={logout}>
                        <NavbarLinkButton isCurrentPage={currentPage === NavbarPages.LOGOUT}>
                            Logout</NavbarLinkButton>
                    </NavbarLink>
                ),
            }
        ]
    const navbarJSXElements = linkElements.map(element => (
        <NavbarItemDroppableContainer key={element.page} page={element.page} isCurrentPage={currentPage === element.page}>
            <NavbarListItem >
                {element.link}
            </NavbarListItem>
        </NavbarItemDroppableContainer>

    ))
    return (
        <NavbarList>
            {navbarJSXElements}
        </NavbarList>
    )
}

const Navbar = ({ currentPage }: NavbarProps): JSX.Element => (
    <NavbarContainer>
        <NavbarElements currentPage={currentPage}></NavbarElements>
    </NavbarContainer>
)

export default Navbar

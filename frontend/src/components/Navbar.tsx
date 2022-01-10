import React, { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { LANDING_PATH, SETTINGS_PATH } from '../constants'
import { UNSELECTED_NAVBAR_COLOR } from '../helpers/styles'
import { NavbarPages } from '../helpers/types'
import { logout } from '../helpers/utils'

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
const NavbarListItem = styled.div<{ isCurrentPage: boolean }>`
    width: 92.5%;
    display: flex;
    background-color: ${props => props.isCurrentPage ? '#3F3F46' : 'inherit'};
    border-radius: 10px;
    margin-bottom: 10px;
    &:hover {
        background-color: #3F3F46;
    }
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
        <NavbarListItem key={element.page} isCurrentPage={currentPage === element.page}>
            {element.link}
        </NavbarListItem>
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

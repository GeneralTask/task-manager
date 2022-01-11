import React, { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { LANDING_PATH, SETTINGS_PATH } from '../constants'
import { BACKGROUND_HOVER, SHADOW_PRIMARY, TASKS_BACKGROUND_GRADIENT, TASKS_BACKROUND, TEXT_BLACK, TEXT_GRAY } from '../helpers/styles'
import { NavbarPages } from '../helpers/types'
import { logout } from '../helpers/utils'

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
    margin-top: 40px;
`
const NavbarListItem = styled.div<{ isCurrentPage: boolean }>`
    width: 92.5%;
    display: flex;
    background-color: ${props => props.isCurrentPage ? BACKGROUND_HOVER : 'inherit'};
    border-radius: 10px;
    margin-bottom: 10px;
    &:hover {
        background-color: ${BACKGROUND_HOVER};
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
    color: ${props => props.isCurrentPage ? TEXT_BLACK : TEXT_GRAY};;
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
        link: ReactElement<Link>
    }[] = [
            {
                page: NavbarPages.TASKS_PAGE,
                link: (
                    <NavbarLink to={LANDING_PATH}>
                        <NavbarLinkButton isCurrentPage={currentPage === NavbarPages.TASKS_PAGE}>
                            Tasks
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
        <NavbarListItem isCurrentPage={currentPage === element.page}>
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

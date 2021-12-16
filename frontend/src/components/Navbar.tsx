import React, { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { LANDING_PATH, SETTINGS_PATH } from '../constants'
import { NavbarPages } from '../helpers/types'
import { logout } from '../helpers/utils'

const NavbarContainer = styled.div`
    flex: 0 0 275px;
    background-color: #27272A;
    color: white;
    height: 100%;
`
const LogoContainer = styled.div`
    margin-top: 40px;
    margin-left: 25px;
    margin-bottom: 60px;
    background-color: white;
    width: 50px;
    height: 50px;
    color: black;
`
const NavbarList = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
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
const NavbarLinkButton = styled.button`
    font-weight: bold;
    font-size: 16px;
    background-color: inherit;
    height: 45px;
    color: white;
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
                link: <NavbarLink to={LANDING_PATH}><NavbarLinkButton>📝 Tasks</NavbarLinkButton></NavbarLink>,

            },
            {
                page: NavbarPages.SETTINGS_PAGE,
                link: <NavbarLink to={SETTINGS_PATH}><NavbarLinkButton>⚙ Settings</NavbarLinkButton></NavbarLink>
            },
            {
                page: NavbarPages.LOGOUT,
                link: <NavbarLink to={LANDING_PATH} onClick={logout}><NavbarLinkButton> Logout</NavbarLinkButton></NavbarLink>
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
        <LogoContainer>GT</LogoContainer>
        <NavbarElements currentPage={currentPage}></NavbarElements>
    </NavbarContainer>
)

export default Navbar

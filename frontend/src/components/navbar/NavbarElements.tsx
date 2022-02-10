import React from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { MESSAGES_PATH, SETTINGS_PATH } from '../../constants'
import { NavbarPage } from '../../helpers/enums'
import { TEXT_BLACK, TEXT_GRAY } from '../../helpers/styles'
import { logout } from '../../helpers/utils'
import NavbarItemCount from './ItemCount'
import NavbarItemDroppableContainer from './ElementDroppableContainer'

const NavbarList = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
`
const NavbarItemGenericDiv = styled.div`
    width: 92.5%;
`
const NavbarListItem = styled.div`
    display: flex;
    width: 100%;
`
const NavbarLink = styled(Link)`
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    cursor: pointer;
    justify-content: left;
    text-decoration: none;
`
const LogoutButtonContainer = styled.div`
    width: 100%;
    height: 100%;
    cursor: pointer;
`
const NavbarLinkButton = styled.button<{ isCurrentPage: boolean }>`
    font-family: Switzer-Variable;
    font-style: normal;
    font-size: 15px;
    line-height: 16px;
    flex-grow: 1;
    text-align: left;

    font-weight: ${(props) => (props.isCurrentPage ? '600' : 'normal')};
    letter-spacing: 0.01em;
    background-color: inherit;
    height: 28px;
    color: ${(props) => (props.isCurrentPage ? TEXT_BLACK : TEXT_GRAY)};
    border: none;
    padding-left: 10px;
    cursor: pointer;
`
const NavbarIcon = styled.img`
    width: 20px;
    height: 20px;
    margin-left: 10px;
`

interface NavbarProps {
    currentPage: NavbarPage
}

const NavbarElements = ({ currentPage }: NavbarProps): JSX.Element => {
    const elements: {
        page: NavbarPage | null
        action: JSX.Element
    }[] = [
        {
            page: NavbarPage.TODAY_PAGE,
            action: (
                <NavbarLink to={'/tasks/today'}>
                    <NavbarIcon src={`${process.env.PUBLIC_URL}/images/tasks.svg`} />
                    <NavbarLinkButton isCurrentPage={currentPage === NavbarPage.TODAY_PAGE}>Today</NavbarLinkButton>
                    <NavbarItemCount page={NavbarPage.TODAY_PAGE} />
                </NavbarLink>
            ),
        },
        {
            page: NavbarPage.BLOCKED_PAGE,
            action: (
                <NavbarLink to={'/tasks/blocked'}>
                    <NavbarIcon src={`${process.env.PUBLIC_URL}/images/tasks.svg`} />
                    <NavbarLinkButton isCurrentPage={currentPage === NavbarPage.BLOCKED_PAGE}>Blocked</NavbarLinkButton>
                    <NavbarItemCount page={NavbarPage.BLOCKED_PAGE} />
                </NavbarLink>
            ),
        },
        {
            page: NavbarPage.BACKLOG_PAGE,
            action: (
                <NavbarLink to={'/tasks/backlog'}>
                    <NavbarIcon src={`${process.env.PUBLIC_URL}/images/tasks.svg`} />
                    <NavbarLinkButton isCurrentPage={currentPage === NavbarPage.BACKLOG_PAGE}>Backlog</NavbarLinkButton>
                    <NavbarItemCount page={NavbarPage.BACKLOG_PAGE} />
                </NavbarLink>
            ),
        },
        {
            page: NavbarPage.DONE_PAGE,
            action: (
                <NavbarLink to={'/tasks/done'}>
                    <NavbarIcon src={`${process.env.PUBLIC_URL}/images/tasks.svg`} />
                    <NavbarLinkButton isCurrentPage={currentPage === NavbarPage.DONE_PAGE}>Done</NavbarLinkButton>
                    <NavbarItemCount page={NavbarPage.DONE_PAGE} />
                </NavbarLink>
            ),
        },
        {
            page: NavbarPage.MESSAGES_PAGE,
            action: (
                <NavbarLink to={MESSAGES_PATH}>
                    <NavbarIcon src={`${process.env.PUBLIC_URL}/images/messages.svg`} />
                    <NavbarLinkButton isCurrentPage={currentPage === NavbarPage.MESSAGES_PAGE}>
                        Messages
                    </NavbarLinkButton>
                    <NavbarItemCount page={NavbarPage.MESSAGES_PAGE} />
                </NavbarLink>
            ),
        },
        {
            page: NavbarPage.SETTINGS_PAGE,
            action: (
                <NavbarLink to={SETTINGS_PATH}>
                    <NavbarIcon src={`${process.env.PUBLIC_URL}/images/settings.svg`} />
                    <NavbarLinkButton isCurrentPage={currentPage === NavbarPage.SETTINGS_PAGE}>
                        Settings
                    </NavbarLinkButton>
                </NavbarLink>
            ),
        },
        {
            page: null,
            action: (
                <LogoutButtonContainer onClick={logout}>
                    <NavbarLinkButton isCurrentPage={currentPage === NavbarPage.LOGOUT}>Logout</NavbarLinkButton>
                </LogoutButtonContainer>
            ),
        },
    ]
    const navbarJSXElements = elements.map((element, index) => {
        if (element.page) {
            return (
                <NavbarItemDroppableContainer
                    key={element.page}
                    page={element.page}
                    isCurrentPage={currentPage === element.page}
                >
                    <NavbarListItem>{element.action}</NavbarListItem>
                </NavbarItemDroppableContainer>
            )
        }
        return (
            <NavbarItemGenericDiv key={index}>
                <NavbarListItem>{element.action}</NavbarListItem>
            </NavbarItemGenericDiv>
        )
    })
    return <NavbarList>{navbarJSXElements}</NavbarList>
}

export default NavbarElements

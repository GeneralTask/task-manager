import React, { } from 'react'
import styled from 'styled-components'
import { NavbarPage } from '../../helpers/enums'
import {
    SHADOW_PRIMARY,
    TASKS_BACKGROUND_GRADIENT,
    TASKS_BACKROUND,
} from '../../helpers/styles'
import NavbarElements from './NavbarElements'

const NavbarContainer = styled.div`
    flex: 0 0 275px;
    background-image: linear-gradient(to bottom right, ${TASKS_BACKGROUND_GRADIENT}, ${TASKS_BACKROUND} 90%);
    color: white;
    height: 100%;
    z-index: 1;
    box-shadow: ${SHADOW_PRIMARY};
`
const Logo = styled.img`
    width: 48px;
    height: 48px;
    padding: 1em;
`

const NavbarHeader = (): JSX.Element => (
    <div>
        <Logo src={`${process.env.PUBLIC_URL}/images/generaltask.svg`} />
    </div>
)

interface NavbarProps {
    currentPage: NavbarPage
}
const Navbar = ({ currentPage }: NavbarProps): JSX.Element => (
    <NavbarContainer>
        <NavbarHeader />
        <NavbarElements currentPage={currentPage} />
    </NavbarContainer>
)

export default Navbar

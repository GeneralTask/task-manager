import React from 'react'
import styled from 'styled-components'
import { NavbarPages } from '../../helpers/enums'
import { shadow } from '../../helpers/styles'
import NavbarElements from './NavbarElements'
import NavbarFooter from './NavbarFooter'

const NavbarContainer = styled.div`
    display: flex;
    flex-direction: column;
    flex: 0 0 275px;
    background: transparent;
    color: white;
    height: 100%;
    z-index: 1;
    box-shadow: ${shadow.PRIMARY};
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
    currentPage: NavbarPages
}
const Navbar = ({ currentPage }: NavbarProps): JSX.Element => (
    <NavbarContainer>
        <NavbarHeader />
        <NavbarElements currentPage={currentPage} />
        <NavbarFooter />
    </NavbarContainer>
)

export default Navbar

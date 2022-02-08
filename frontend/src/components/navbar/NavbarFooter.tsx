import React from 'react'
import styled from 'styled-components'
import FeedbackButton from '../feedback/FeedbackButton'

const FooterContainer = styled.div`
    margin-top: auto;
    background: rgba(255, 255, 255, 0.5);
    padding: 12px;
`
const NavbarFooter = (): JSX.Element => {
    return (
        <FooterContainer>
            <FeedbackButton />
        </FooterContainer>
    )
}

export default NavbarFooter

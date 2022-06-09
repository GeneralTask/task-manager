import { Column, HeaderContainer } from './styles'

import React from 'react'

const Header = () => {
    return (
        <HeaderContainer>
            <Column type="title"># Title</Column>
            <Column type="status">Status</Column>
            <Column type="author">Author</Column>
            <Column type="comments">Comments</Column>
            <Column type="branch">Branch Name</Column>
            <Column type="link">Link</Column>
        </HeaderContainer>
    )
}

export default Header

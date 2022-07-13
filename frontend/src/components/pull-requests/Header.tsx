import { Column, HeaderContainer } from './styles'

import React from 'react'

const Header = () => {
    // TODO: remove this when we decide not to have a header for the Pull Requests View

    return (
        <HeaderContainer>
            <Column type="title"># Title</Column>
            <Column type="status">Required Action</Column>
            {/* <Column type="author">Author</Column> */}
            <Column type="comments">Comments</Column>
            {/* <Column type="branch">Branch Name</Column> */}
            <Column type="link">Link</Column>
        </HeaderContainer>
    )
}

export default Header

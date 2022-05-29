import { Column, ColumnWidths, HeaderContainer } from './styles'

import React from 'react'

const Header = () => {
    return (
        <HeaderContainer>
            <Column width={ColumnWidths.title}># Title</Column>
            <Column width={ColumnWidths.status}>Status</Column>
            <Column width={ColumnWidths.author}>Author</Column>
            <Column width={ColumnWidths.branch}>Branch Name</Column>
            <Column width={ColumnWidths.link}></Column>
        </HeaderContainer>
    )
}

export default Header

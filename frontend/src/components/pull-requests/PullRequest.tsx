import { Column, ColumnWidths, Row } from './styles'

import React from 'react'

const PullRequest = () => {
    return (
        <Row>
            <Column width={ColumnWidths.title}># Title</Column>
            <Column width={ColumnWidths.status}>Author</Column>
            <Column width={ColumnWidths.author}>State</Column>
            <Column width={ColumnWidths.branch}>Created At</Column>
            <Column width={ColumnWidths.link}>Created At</Column>
        </Row>
    )
}

export default PullRequest

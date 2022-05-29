import { Column, ColumnWidths, Row } from './styles'

import React from 'react'
import { TPullRequest } from '../../utils/types'

interface PullRequestProps {
    pullRequest: TPullRequest
}
const PullRequest = ({ pullRequest }: PullRequestProps) => {
    const { title, number, status, author, created_at, branch, link } = pullRequest
    return (
        <Row>
            <Column width={ColumnWidths.title}>
                {number} {title}
            </Column>
            <Column width={ColumnWidths.status}>{status}</Column>
            <Column width={ColumnWidths.author}>
                {author} {created_at}
            </Column>
            <Column width={ColumnWidths.branch}>{branch}</Column>
            <Column width={ColumnWidths.link}>
                <a href={link}>link</a>
            </Column>
        </Row>
    )
}

export default PullRequest

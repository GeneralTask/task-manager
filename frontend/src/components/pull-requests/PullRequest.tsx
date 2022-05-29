import { Column, ColumnWidths, Row, TruncatedText } from './styles'

import { DateTime } from 'luxon'
import React from 'react'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { TPullRequest } from '../../utils/types'
import { getHumanDateTime } from '../../utils/utils'

interface PullRequestProps {
    pullRequest: TPullRequest
}
const PullRequest = ({ pullRequest }: PullRequestProps) => {
    const { title, number, status, author, created_at, branch, link } = pullRequest

    const formattedTime = getHumanDateTime(DateTime.fromISO(created_at))
    return (
        <Row>
            <Column width={ColumnWidths.title}>
                <TruncatedText>{title}</TruncatedText>
                {/* <br /> */}
                <SubtitleSmall>{'#' + number}</SubtitleSmall>
            </Column>
            <Column width={ColumnWidths.status}>{status}</Column>
            <Column width={ColumnWidths.author}>
                <SubtitleSmall>{formattedTime}</SubtitleSmall>
                {/* <br /> */}
                <TruncatedText>{author}</TruncatedText>
            </Column>
            <Column width={ColumnWidths.branch}>{branch}</Column>
            <Column width={ColumnWidths.link}>
                <a href={link}>link</a>
            </Column>
        </Row>
    )
}

export default PullRequest

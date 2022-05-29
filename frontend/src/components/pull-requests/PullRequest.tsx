import { Column, ColumnWidths, LinkButton, Row, TruncatedText } from './styles'

import { DateTime } from 'luxon'
import { Icon } from '../atoms/Icon'
import React from 'react'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { TPullRequest } from '../../utils/types'
import { getHumanDateTime } from '../../utils/utils'
import { icons } from '../../styles/images'

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
                <SubtitleSmall>{'#' + number}</SubtitleSmall>
            </Column>
            <Column width={ColumnWidths.status}>
                <TruncatedText>{status}</TruncatedText>
            </Column>
            <Column width={ColumnWidths.author}>
                <SubtitleSmall>{formattedTime}</SubtitleSmall>
                <TruncatedText>{author}</TruncatedText>
            </Column>
            <Column width={ColumnWidths.branch}>
                <TruncatedText>{branch}</TruncatedText>
            </Column>
            <Column width={ColumnWidths.link}>
                <LinkButton href={link} target="blank">
                    <Icon source={icons.external_link} size="small" />
                </LinkButton>
            </Column>
        </Row>
    )
}

export default PullRequest

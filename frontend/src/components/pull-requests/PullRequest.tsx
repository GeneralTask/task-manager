import { Column, LinkButton, PullRequestRow, Status, TruncatedText } from './styles'

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
        <PullRequestRow>
            <Column type="title">
                <TruncatedText>{title}</TruncatedText>
                <SubtitleSmall>{'#' + number}</SubtitleSmall>
            </Column>
            <Column type="status">
                <Status type={status.color}>
                    <TruncatedText>{status.text}</TruncatedText>
                </Status>
            </Column>
            <Column type="author">
                <SubtitleSmall>{formattedTime}</SubtitleSmall>
                <TruncatedText>{author}</TruncatedText>
            </Column>
            <Column type="branch">
                <TruncatedText>{branch}</TruncatedText>
            </Column>
            <Column type="link">
                <LinkButton href={link} target="_blank">
                    <Icon source={icons.external_link} size="small" />
                </LinkButton>
            </Column>
        </PullRequestRow>
    )
}

export default PullRequest

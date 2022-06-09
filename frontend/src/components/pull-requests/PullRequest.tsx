import { Column, CommentsContainer, LinkButton, PullRequestRow, TruncatedText } from './styles'

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
    const { title, number, status, author, num_comments, created_at, branch, link } = pullRequest

    const formattedTime = getHumanDateTime(DateTime.fromISO(created_at))
    return (
        <PullRequestRow>
            <Column type="title">
                <TruncatedText>{title}</TruncatedText>
                <SubtitleSmall>{'#' + number}</SubtitleSmall>
            </Column>
            <Column type="status">
                <TruncatedText>{status.text}</TruncatedText>
            </Column>
            <Column type="author">
                <SubtitleSmall>{formattedTime}</SubtitleSmall>
                <TruncatedText>{author}</TruncatedText>
            </Column>
            <Column type="comments">
                <CommentsContainer>
                    <Icon source={icons.speechBubble} size="small" yOffset="4px" />
                    {num_comments}
                </CommentsContainer>
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

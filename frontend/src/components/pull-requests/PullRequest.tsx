import { icons } from '../../styles/images'
import { TPullRequest } from '../../utils/types'
import { getHumanDateTime } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import BranchName from './BranchName'
import { Column, CommentsCountContainer, LinkButton, PullRequestRow, TruncatedText } from './styles'
import { DateTime } from 'luxon'
import React from 'react'

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
                <CommentsCountContainer>
                    <Icon source={icons.speechBubble} size="small" />
                    {num_comments}
                </CommentsCountContainer>
            </Column>
            <Column type="branch">
                <BranchName name={branch} />
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

import { icons } from '../../styles/images'
import { TPullRequest } from '../../utils/types'
import { getHumanTimeSinceDateTime } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { Column, CommentsCountContainer, LinkButton, PullRequestRow, Status, TruncatedText } from './styles'
import { DateTime } from 'luxon'
import React from 'react'

interface PullRequestProps {
    pullRequest: TPullRequest
}
const PullRequest = ({ pullRequest }: PullRequestProps) => {
    const { title, number, status, author, num_comments, created_at, deeplink } = pullRequest

    const formattedTime = getHumanTimeSinceDateTime(DateTime.fromISO(created_at))
    const formattedSubtitle = `#${number} opened ${formattedTime} by ${author}`
    return (
        <PullRequestRow>
            <Column type="link">
                <LinkButton href={deeplink} target="_blank">
                    <Icon source={icons.external_link} size="small" />
                </LinkButton>
            </Column>
            <Column type="title">
                <TruncatedText>{title}</TruncatedText>
                <SubtitleSmall>{formattedSubtitle}</SubtitleSmall>
            </Column>
            <Column type="status">
                <Status type={status.color}>{status.text}</Status>
            </Column>
            {/* <Column type="author">
                <SubtitleSmall>{formattedTime}</SubtitleSmall>
                <TruncatedText>{author}</TruncatedText>
            </Column> */}
            <Column type="comments">
                <CommentsCountContainer>
                    <Icon source={icons.speechBubble} size="small" />
                    {num_comments}
                </CommentsCountContainer>
            </Column>
            {/* <Column type="branch">
                <BranchName name={branch} />
            </Column> */}
        </PullRequestRow>
    )
}

export default PullRequest

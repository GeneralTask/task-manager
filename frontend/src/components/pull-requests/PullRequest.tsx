import { icons } from '../../styles/images'
import { TPullRequest } from '../../utils/types'
import { getHumanTimeSinceDateTime } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { Column, CommentsCountContainer, LinkButton, PullRequestRow, Status, TruncatedText } from './styles'
import { DateTime } from 'luxon'
import React, { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

interface PullRequestProps {
    pullRequest: TPullRequest
    link: string
    isSelected: boolean
}
const PullRequest = ({ pullRequest, link, isSelected }: PullRequestProps) => {
    const params = useParams()
    const navigate = useNavigate()

    const { title, number, status, author, num_comments, last_updated_at, deeplink } = pullRequest
    const formattedTimeSince = getHumanTimeSinceDateTime(DateTime.fromISO(last_updated_at))
    const formattedSubtitle = `#${number} updated ${formattedTimeSince} by ${author}`

    const onClickHandler = useCallback(() => {
        navigate(link)
    }, [params, pullRequest])

    return (
        <PullRequestRow onClick={onClickHandler} highlight={isSelected}>
            <Column type="title">
                <TruncatedText>{title}</TruncatedText>
                <SubtitleSmall>{formattedSubtitle}</SubtitleSmall>
            </Column>
            <Column type="status">
                <Status type={status.color}>{status.text}</Status>
            </Column>
            <Column type="comments">
                <CommentsCountContainer>
                    <Icon icon={icons.comment} size="small" />
                    {num_comments}
                </CommentsCountContainer>
            </Column>
            <Column type="link">
                <LinkButton href={deeplink} target="_blank">
                    <Icon icon={icons.external_link} size="small" />
                </LinkButton>
            </Column>
        </PullRequestRow>
    )
}

export default PullRequest

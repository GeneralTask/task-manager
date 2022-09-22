import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { icons } from '../../styles/images'
import { TPullRequest } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import NoStyleAnchor from '../atoms/NoStyleAnchor'
import GTButton from '../atoms/buttons/GTButton'
import { Column, CommentsCountContainer, LinkButtonContainer, PullRequestRow, Status, TitleContainer } from './styles'

interface PullRequestProps {
    pullRequest: TPullRequest
    link: string
    isSelected: boolean
}
const PullRequest = ({ pullRequest, link, isSelected }: PullRequestProps) => {
    const params = useParams()
    const navigate = useNavigate()

    const { title, status, num_comments, deeplink } = pullRequest

    const onClickHandler = useCallback(() => {
        navigate(link)
    }, [params, pullRequest])

    return (
        <PullRequestRow onClick={onClickHandler} isSelected={isSelected}>
            <TitleContainer>{title}</TitleContainer>
            <Column>
                <Status type={status.color}>{status.text}</Status>
                {num_comments > 0 && (
                    <CommentsCountContainer>
                        <Icon icon={icons.comment} size="xSmall" />
                        {num_comments}
                    </CommentsCountContainer>
                )}
                <LinkButtonContainer>
                    <NoStyleAnchor href={deeplink} target="_blank" rel="noreferrer">
                        <GTButton icon={icons.external_link} styleType="secondary" />
                    </NoStyleAnchor>
                </LinkButtonContainer>
            </Column>
        </PullRequestRow>
    )
}

export default PullRequest

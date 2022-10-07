import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Log from '../../services/api/log'
import { TPullRequest } from '../../utils/types'
import CommentCount from '../atoms/CommentCount'
import { PurpleEdge } from '../atoms/SelectableContainer'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import { Column, LinkButtonContainer, PullRequestRow, Status, TitleContainer } from './styles'

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
        Log(`navigate_pr___${link}`)
        navigate(link)
    }, [params, pullRequest])

    return (
        <PullRequestRow onClick={onClickHandler} isSelected={isSelected}>
            {isSelected && <PurpleEdge />}
            <TitleContainer>{title}</TitleContainer>
            <Column>
                <Status type={status.color}>{status.text}</Status>
                {num_comments > 0 && <CommentCount count={num_comments} />}
                <LinkButtonContainer>
                    <ExternalLinkButton link={deeplink} />
                </LinkButtonContainer>
            </Column>
        </PullRequestRow>
    )
}

export default PullRequest

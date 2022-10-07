import { useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactTooltip from 'react-tooltip'
import { TPullRequest } from '../../utils/types'
import CommentCount from '../atoms/CommentCount'
import { PurpleEdge } from '../atoms/SelectableContainer'
import TooltipWrapper from '../atoms/TooltipWrapper'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import { PULL_REQUEST_ACTIONS } from './constants'
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
        navigate(link)
    }, [params, pullRequest])

    const statusDescription = PULL_REQUEST_ACTIONS.find((action) => action.text === status.text)?.description

    useEffect(() => {
        ReactTooltip.rebuild()
    }, [])

    return (
        <PullRequestRow onClick={onClickHandler} isSelected={isSelected}>
            {isSelected && <PurpleEdge />}
            <TitleContainer>{title}</TitleContainer>
            <Column>
                {statusDescription ? (
                    <TooltipWrapper dataTip={statusDescription} tooltipId="tooltip">
                        <Status type={status.color}>{status.text}</Status>
                    </TooltipWrapper>
                ) : (
                    <Status type={status.color}>{status.text}</Status>
                )}
                {num_comments > 0 && <CommentCount count={num_comments} />}
                <LinkButtonContainer>
                    <ExternalLinkButton link={deeplink} />
                </LinkButtonContainer>
            </Column>
        </PullRequestRow>
    )
}

export default PullRequest

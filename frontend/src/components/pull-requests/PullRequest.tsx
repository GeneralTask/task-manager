import { useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Log from '../../services/api/log'
import { Colors } from '../../styles'
import { PULL_REQUEST_ACTIONS } from '../../utils/sortAndFilter/pull-requests.config'
import { TPullRequest } from '../../utils/types'
import CommentCount from '../atoms/CommentCount'
import { EdgeHighlight } from '../atoms/SelectableContainer'
import ExternalLinkButton from '../atoms/buttons/ExternalLinkButton'
import { useCalendarContext } from '../calendar/CalendarContext'
import Status from './Status'
import { Column, LinkButtonContainer, PullRequestRow, TitleContainer } from './styles'

interface PullRequestProps {
    pullRequest: TPullRequest
    link: string
    isSelected: boolean
}
const PullRequest = ({ pullRequest, link, isSelected }: PullRequestProps) => {
    const params = useParams()
    const navigate = useNavigate()
    const { calendarType, setCalendarType, setDate, dayViewDate } = useCalendarContext()

    const { title, status, num_comments, deeplink } = pullRequest

    const onClickHandler = useCallback(() => {
        Log(`pr_select___${link}`)
        navigate(link)
        if (calendarType === 'week' && isSelected) {
            setCalendarType('day')
            setDate(dayViewDate)
        }
    }, [params, pullRequest])

    const statusDescription = PULL_REQUEST_ACTIONS.find((action) => action.text === status.text)?.description

    return (
        <PullRequestRow onClick={onClickHandler} isSelected={isSelected}>
            {isSelected && <EdgeHighlight color={Colors.gtColor.orange} />}
            <TitleContainer>{title}</TitleContainer>
            <Column>
                <Status description={statusDescription} status={status.text} color={status.color} />
                {num_comments > 0 && <CommentCount count={num_comments} />}
                <LinkButtonContainer>
                    <ExternalLinkButton link={deeplink} />
                </LinkButtonContainer>
            </Column>
        </PullRequestRow>
    )
}

export default PullRequest

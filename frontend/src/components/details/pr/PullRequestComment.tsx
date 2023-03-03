import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../../styles'
import { getHumanTimeSinceDateTime } from '../../../utils/utils'
import MarkdownRenderer from '../../atoms/MarkdownRenderer'

const CommentContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
    padding: ${Spacing._8};
`
const TopContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing._8};
    color: ${Colors.text.black};
`
const BodyContainer = styled.div`
    ${Typography.deprecated_bodySmall};
`
const UsernameText = styled.div`
    ${Typography.deprecated_bodySmall};
    ${Typography.deprecated_bold};
`
const GrayText = styled.span`
    color: ${Colors.text.light};
    ${Typography.deprecated_bodySmall};
`

interface PullRequestCommentProps {
    author: string
    body: string
    lastUpdatedAt: string
    isAuthorOfPR?: boolean
}

const PullRequestComment = ({ author, body, lastUpdatedAt, isAuthorOfPR = false }: PullRequestCommentProps) => {
    const dateSent = DateTime.fromISO(lastUpdatedAt)
    return (
        <CommentContainer>
            <TopContainer>
                <UsernameText>{`${author} ${isAuthorOfPR ? '(Author)' : ''}`}</UsernameText>
                <GrayText>{getHumanTimeSinceDateTime(dateSent)}</GrayText>
            </TopContainer>
            <BodyContainer>
                {body ? <MarkdownRenderer>{body}</MarkdownRenderer> : <GrayText>No comment</GrayText>}
            </BodyContainer>
        </CommentContainer>
    )
}

export default PullRequestComment

import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../../styles'
import { TLinearComment } from '../../../utils/types'
import LinearComment from './LinearComment'

const CommentListContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
    min-height: 0;
`
const CommentHeader = styled.div`
    color: ${Colors.text.light};
    ${Typography.eyebrow};
    margin-bottom: ${Spacing._16};
`

interface LinearCommentListProps {
    comments: TLinearComment[]
}

const LinearCommentList = ({ comments }: LinearCommentListProps) => {
    // This is kinda sus, but it gets the job done until backend is fixed
    const sortedComments = comments.slice().sort((a, b) => {
        if (DateTime.fromISO(a.created_at).toMillis() === 0) {
            return 1
        } else if (DateTime.fromISO(b.created_at).toMillis() === 0) {
            return -1
        }
        return DateTime.fromISO(a.created_at).toMillis() - DateTime.fromISO(b.created_at).toMillis()
    })
    return (
        <CommentListContainer>
            <CommentHeader>Comments ({comments.length})</CommentHeader>
            {sortedComments.map((comment, index) => (
                <LinearComment key={index} comment={comment} />
            ))}
        </CommentListContainer>
    )
}

export default LinearCommentList

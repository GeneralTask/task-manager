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

const LinearCommentList = ({ comments }: LinearCommentListProps) => (
    <CommentListContainer>
        <CommentHeader>Comments ({comments.length})</CommentHeader>
        {[...comments].reverse().map((comment) => (
            <LinearComment key={comment.created_at} comment={comment} />
        ))}
    </CommentListContainer>
)

export default LinearCommentList

import React from 'react'
import { TLinearComment } from '../../../utils/types'
import LinearComment from './LinearComment'
import styled from 'styled-components'
import { Spacing } from '../../../styles'

const CommentListContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing.margin._8};
`

interface LinearCommentListProps {
    comments: TLinearComment[]
}

const LinearCommentList = ({ comments }: LinearCommentListProps) => (
    <CommentListContainer>
        {comments.map((comment) => (
            <LinearComment key={comment.created_at} comment={comment} />
        ))}
    </CommentListContainer>
)

export default LinearCommentList

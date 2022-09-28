import { useEffect, useRef } from 'react'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../../styles'
import { TLinearComment } from '../../../utils/types'
import LinearComment from './LinearComment'

const CommentListContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${Spacing._8};
    flex-basis: 400px;
    flex-grow: 0;
    flex-shrink: 1;
    min-height: 0;
`
const CommentHeader = styled.div`
    color: ${Colors.text.light};
    ${Typography.eyebrow};
    margin-bottom: ${Spacing._24};
`

interface LinearCommentListProps {
    comments: TLinearComment[]
}

const LinearCommentList = ({ comments }: LinearCommentListProps) => {
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView()
    }, [comments])

    return (
        <CommentListContainer>
            <CommentHeader>Comments ({comments.length})</CommentHeader>
            {[...comments].reverse().map((comment, i) => (
                <LinearComment
                    key={comment.created_at}
                    comment={comment}
                    ref={i === comments.length - 1 ? bottomRef : undefined}
                />
            ))}
        </CommentListContainer>
    )
}

export default LinearCommentList

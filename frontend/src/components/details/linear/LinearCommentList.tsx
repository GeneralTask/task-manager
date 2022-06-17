import React, { useEffect, useRef } from 'react'
import { TLinearComment } from '../../../utils/types'
import LinearComment from './LinearComment'
import styled from 'styled-components'
import { Colors, Spacing } from '../../../styles'

const CommentListContainer = styled.div`
    display: flex;
    flex-direction: column;
    max-height: 400px;
    overflow-y: auto;
    gap: ${Spacing.margin._8};
`

const DividerView = styled.div`
    height: 1px;
    background-color: ${Colors.gray._300};
    margin: ${Spacing.margin._8};
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
        <>
            <DividerView />
            <CommentListContainer>
                {comments
                    .slice()
                    .reverse()
                    .map((comment, i) => {
                        return (
                            <LinearComment
                                key={comment.created_at}
                                comment={comment}
                                ref={i === comments.length - 1 ? bottomRef : undefined}
                            />
                        )
                    })}
            </CommentListContainer>
        </>
    )
}

export default LinearCommentList

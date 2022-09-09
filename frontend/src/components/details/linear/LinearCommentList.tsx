import { useEffect, useRef } from 'react'
import { TLinearComment } from '../../../utils/types'
import LinearComment from './LinearComment'
import styled from 'styled-components'
import { Colors, Spacing } from '../../../styles'

const CommentListContainer = styled.div`
    display: flex;
    flex-direction: column;
    max-height: 400px;
    overflow-y: auto;
    gap: ${Spacing._8};
`

const DividerView = styled.div`
    height: 1px;
    background-color: ${Colors.background.dark};
    margin: ${Spacing._8};
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
                {[...comments].reverse().map((comment, i) => (
                    <LinearComment
                        key={comment.created_at}
                        comment={comment}
                        ref={i === comments.length - 1 ? bottomRef : undefined}
                    />
                ))}
            </CommentListContainer>
        </>
    )
}

export default LinearCommentList

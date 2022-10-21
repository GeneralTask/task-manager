import { useCallback, useState } from 'react'
import styled from 'styled-components'
import { useKeyboardShortcut } from '../../hooks'
import { usePostComment } from '../../services/api/tasks.hooks'
import { Border, Colors } from '../../styles'
import GTTextField from '../atoms/GTTextField'
import GTButton from '../atoms/buttons/GTButton'

const LINEAR_ADD_COMMENT_HEIGHT = 100

const BottomStickyContainer = styled.div`
    position: sticky;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.medium};
    margin-top: auto;
`
interface CreateLinearCommentProps {
    taskId: string
}
const CreateLinearComment = ({ taskId }: CreateLinearCommentProps) => {
    const { mutate: postComment } = usePostComment()
    const [comment, setComment] = useState('')

    const submitComment = useCallback(() => {
        if (comment) {
            postComment({ taskId: taskId, body: comment })
            setComment('')
        }
    }, [comment, postComment, taskId])

    useKeyboardShortcut('submitComment', submitComment)

    return (
        <BottomStickyContainer>
            <GTTextField
                type="markdown"
                placeholder="Add a comment"
                value={comment}
                fontSize="small"
                minHeight={LINEAR_ADD_COMMENT_HEIGHT}
                onChange={setComment}
                actions={
                    <GTButton value="Comment" styleType="secondary" size="small" onClick={() => submitComment()} />
                }
                isFullHeight
            />
        </BottomStickyContainer>
    )
}

export default CreateLinearComment

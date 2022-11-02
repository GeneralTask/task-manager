import { useCallback, useState } from 'react'
import { useKeyboardShortcut } from '../../hooks'
import { usePostComment } from '../../services/api/tasks.hooks'
import GTTextField from '../atoms/GTTextField'
import GTButton from '../atoms/buttons/GTButton'

const LINEAR_ADD_COMMENT_HEIGHT = 100

interface CreateLinearCommentProps {
    taskId: string
    numComments: number
}
const CreateLinearComment = ({ taskId, numComments }: CreateLinearCommentProps) => {
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
        <GTTextField
            itemId={`${taskId}${numComments}`}
            type="markdown"
            placeholder="Add a comment"
            value={comment}
            fontSize="small"
            minHeight={LINEAR_ADD_COMMENT_HEIGHT}
            onChange={setComment}
            actions={<GTButton value="Comment" styleType="secondary" size="small" onClick={() => submitComment()} />}
        />
    )
}

export default CreateLinearComment

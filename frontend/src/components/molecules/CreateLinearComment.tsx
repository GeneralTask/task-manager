import { useCallback, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import KEYBOARD_SHORTCUTS from '../../constants/shortcuts'
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
            postComment({ id: taskId, body: comment, optimisticId: uuidv4() })
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
            keyDownExceptions={[KEYBOARD_SHORTCUTS.submitComment.key]}
            actions={<GTButton value="Comment" styleType="secondary" size="small" onClick={() => submitComment()} />}
        />
    )
}

export default CreateLinearComment

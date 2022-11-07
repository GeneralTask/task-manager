import { DateTime } from 'luxon'
import styled from 'styled-components'
import { usePreviewMode } from '../../../hooks'
import { Colors, Spacing, Typography } from '../../../styles'
import { TLinearComment } from '../../../utils/types'
import { emptyFunction, getHumanTimeSinceDateTime } from '../../../utils/utils'
import GTTextField from '../../atoms/GTTextField'

const TopContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing._12};
    color: ${Colors.text.black};
`
const BodyContainer = styled.div`
    padding: ${Spacing._4};
    margin-bottom: ${Spacing._16};
    ${Typography.bodySmall};
`
const UsernameText = styled.div`
    ${Typography.bodySmall};
    ${Typography.bold};
`
const GrayText = styled.span`
    color: ${Colors.text.light};
    ${Typography.bodySmall};
`

interface LinearCommentProps {
    comment: TLinearComment
}

const LinearComment = ({ comment }: LinearCommentProps) => {
    const dateSent = DateTime.fromISO(comment.created_at)
    const { isPreviewMode } = usePreviewMode()
    return (
        <div>
            <TopContainer>
                <UsernameText>{`${comment.user.Name} (${comment.user.DisplayName})`}</UsernameText>
                <GrayText>{getHumanTimeSinceDateTime(dateSent)}</GrayText>
            </TopContainer>
            <BodyContainer>
                {isPreviewMode ? (
                    <GTTextField
                        type="markdown"
                        value={comment.body}
                        onChange={emptyFunction}
                        fontSize="small"
                        readOnly
                        disabled
                    />
                ) : (
                    <span>{comment.body}</span>
                )}
            </BodyContainer>
        </div>
    )
}

export default LinearComment

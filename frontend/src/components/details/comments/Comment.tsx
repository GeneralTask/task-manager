import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useGetUserInfo } from '../../../services/api/user-info.hooks'
import { Colors, Spacing, Typography } from '../../../styles'
import { TComment, TTaskSourceName } from '../../../utils/types'
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

interface CommentProps {
    comment: TComment
    sourceName: TTaskSourceName
}

const Comment = ({ comment, sourceName }: CommentProps) => {
    const { data: userInfo } = useGetUserInfo()
    const dateSent = DateTime.fromISO(comment.created_at)
    // This is kinda sus, but it gets the job done until backend is fixed
    const modifiedDateSent = getHumanTimeSinceDateTime(dateSent.toMillis() === 0 ? DateTime.local() : dateSent)

    let userName = comment.user.Name ? comment.user.Name : userInfo?.linear_name
    if (sourceName === 'Linear' && (comment.user.DisplayName ?? userInfo?.linear_display_name)) {
        userName += ` (${comment.user.DisplayName ?? userInfo?.linear_display_name})`
    }
    const contentType = sourceName === 'Jira' ? 'atlassian' : 'markdown'

    return (
        <div>
            <TopContainer>
                <UsernameText>{userName}</UsernameText>
                <GrayText>{modifiedDateSent}</GrayText>
            </TopContainer>
            <BodyContainer>
                <GTTextField
                    itemId={comment.user.ExternalID + comment.body + comment.created_at}
                    type={contentType}
                    value={comment.body}
                    onChange={emptyFunction}
                    fontSize="small"
                    readOnly
                    disabled
                />
            </BodyContainer>
        </div>
    )
}

export default Comment

import { DateTime } from 'luxon'
import styled from 'styled-components'
import { useGetUserInfo } from '../../../services/api/user-info.hooks'
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
    const { data: userInfo } = useGetUserInfo()
    const dateSent = DateTime.fromISO(comment.created_at)
    const modifiedDateSent = getHumanTimeSinceDateTime(dateSent.toMillis() === 0 ? DateTime.local() : dateSent)
    const name = comment.user.Name ? comment.user.Name : userInfo?.linear_name
    const displayName = comment.user.DisplayName ? comment.user.DisplayName : userInfo?.linear_display_name

    return (
        <div>
            <TopContainer>
                <UsernameText>{`${name} (${displayName})`}</UsernameText>
                <GrayText>{modifiedDateSent}</GrayText>
            </TopContainer>
            <BodyContainer>
                <GTTextField
                    itemId={comment.user.ExternalID}
                    type="markdown"
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

export default LinearComment

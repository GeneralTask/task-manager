import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../../styles'
import { TLinearComment } from '../../../utils/types'
import { getHumanTimeSinceDateTime } from '../../../utils/utils'

const TopContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing._8};
    padding: ${Spacing._4};
    color: ${Colors.text.black};
    margin-bottom: ${Spacing._16};
`
const BodyContainer = styled.div`
    padding: ${Spacing._4};
    margin-bottom: ${Spacing._32};
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
    return (
        <div>
            <TopContainer>
                <UsernameText>{`${comment.user.Name} (${comment.user.DisplayName})`}</UsernameText>
                <GrayText>{getHumanTimeSinceDateTime(dateSent)}</GrayText>
            </TopContainer>
            <BodyContainer>
                <span>{comment.body}</span>
            </BodyContainer>
        </div>
    )
}

export default LinearComment

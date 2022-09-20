import { forwardRef } from 'react'
import { DateTime } from 'luxon'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { TLinearComment } from '../../../utils/types'
import { getHumanTimeSinceDateTime } from '../../../utils/utils'

const CommentContainer = styled.div`
    border: ${Border.stroke.medium} solid ${Colors.background.dark};
    border-radius: ${Border.radius.large};
    padding: ${Spacing._8};
`
const TopContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing._8};
    padding: ${Spacing._4};
`
const BodyContainer = styled.div`
    padding: ${Spacing._4};
`
const BlackText = styled.span`
    color: ${Colors.text.black};
    ${Typography.bodySmall};
`
const GrayText = styled(BlackText)`
    color: ${Colors.text.light};
`

interface LinearCommentProps {
    comment: TLinearComment
}

const LinearComment = forwardRef<HTMLDivElement, LinearCommentProps>(({ comment }: LinearCommentProps, ref) => {
    const dateSent = DateTime.fromISO(comment.created_at)
    return (
        <CommentContainer ref={ref}>
            <TopContainer>
                <BlackText>{`${comment.user.Name} (${comment.user.DisplayName})`}</BlackText>
                <GrayText>{getHumanTimeSinceDateTime(dateSent)}</GrayText>
            </TopContainer>
            <BodyContainer>
                <BlackText>{comment.body}</BlackText>
            </BodyContainer>
        </CommentContainer>
    )
})

export default LinearComment

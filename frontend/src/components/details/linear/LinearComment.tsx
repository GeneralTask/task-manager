import React, { forwardRef } from 'react'
import { TLinearComment } from '../../../utils/types'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { DateTime } from 'luxon'
import { getHumanTimeSinceDateTime } from '../../../utils/utils'

const CommentContainer = styled.div`
    border: 1px solid ${Colors.background.dark};
    border-radius: ${Border.radius.large};
    padding: ${Spacing.padding._8};
`
const TopContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: ${Spacing.margin._8};
    padding: ${Spacing.padding._4};
`
const BodyContainer = styled.div`
    padding: ${Spacing.padding._4};
`
const BlackText = styled.span`
    font-size: ${Typography.xSmall.fontSize};
    line-height: ${Typography.xSmall.lineHeight};
    color: ${Colors.text.black};
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

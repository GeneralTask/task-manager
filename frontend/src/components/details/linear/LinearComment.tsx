import React from 'react'
import { TLinearComment } from '../../../utils/types'
import styled from 'styled-components'
import { Border, Colors, Spacing, Typography } from '../../../styles'
import { DateTime } from 'luxon'
import { getHumanTimeSinceDateTime } from '../../../utils/utils'

const CommentContainer = styled.div`
    border: 1px solid ${Colors.gray._200};
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
const BlackText = styled.div`
    font-size: ${Typography.xSmall.fontSize};
    line-height: ${Typography.xSmall.lineHeight};
    color: ${Colors.gray._700};
`
const GrayText = styled(BlackText)`
    color: ${Colors.gray._400};
`

interface LinearCommentProps {
    comment: TLinearComment
}

const LinearComment = ({ comment }: LinearCommentProps) => {
    const date_sent = DateTime.fromISO(comment.created_at)
    return (
        <CommentContainer>
            <TopContainer>
                <BlackText>{`${comment.user.Name} (${comment.user.DisplayName})`}</BlackText>
                <GrayText>{getHumanTimeSinceDateTime(date_sent)}</GrayText>
            </TopContainer>
            <BodyContainer>
                <BlackText>{comment.body}</BlackText>
            </BodyContainer>
        </CommentContainer>
    )
}

export default LinearComment

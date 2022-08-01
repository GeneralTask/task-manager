import { Border, Colors, Spacing } from '../../styles'
import React from 'react'
import { TitleSmall } from '../atoms/title/Title'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import TextArea from '../atoms/TextArea'
import styled from 'styled-components'

const FeedbackHeader = styled.div`
    margin-bottom: ${Spacing.margin._24};
    display: flex;
    flex-direction: column;
`
const TextAreaContainer = styled.div`
    flex: 1;
    margin: ${Spacing.margin._4} 0;
    border: ${Border.stroke.medium} solid ${Colors.background.dark};
    border-radius: ${Border.radius.small};
`
interface FeedbackViewProps {
    feedback: string
    setFeedback: (feedback: string) => void
}
const FeedbackView = (props: FeedbackViewProps) => {
    return (
        <>
            <FeedbackHeader>
                <SubtitleSmall>Let us know how we can improve!</SubtitleSmall>
            </FeedbackHeader>
            <TitleSmall>Feedback</TitleSmall>
            <TextAreaContainer>
                <TextArea
                    value={props.feedback}
                    placeholder="Type in your feedback here."
                    setValue={props.setFeedback}
                />
            </TextAreaContainer>
        </>
    )
}

export default FeedbackView

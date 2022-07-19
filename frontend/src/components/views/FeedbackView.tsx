import { Border, Colors, Spacing } from '../../styles'
import React, { useState } from 'react'
import { TitleMedium, TitleSmall } from '../atoms/title/Title'

import { ModalEnum } from '../../utils/enums'
import GTButton from '../atoms/buttons/GTButton'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import TextArea from '../atoms/TextArea'
import { setShowModal } from '../../redux/tasksPageSlice'
import styled from 'styled-components'
import { useAppDispatch } from '../../redux/hooks'
import { usePostFeedback } from '../../services/api/feedback.hooks'

const FeedbackViewContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: ${Spacing.padding._16};
    box-sizing: border-box;
`
const FeedbackHeader = styled.div`
    margin-bottom: ${Spacing.margin._24};
    display: flex;
    flex-direction: column;
`
const TextAreaContainer = styled.div`
    flex: 1;
    margin-top: ${Spacing.margin._4};
    border: 1px solid ${Colors.gray._200};
    border-radius: ${Border.radius.small};
`
const ButtonContainer = styled.div`
    display: flex;
    flex-direction: row;
    margin-top: ${Spacing.margin._8};
    gap: ${Spacing.margin._8};
`

const FeedbackView = () => {
    const dispatch = useAppDispatch()
    const [feedback, setFeedback] = useState('')
    const { mutate: postFeedback } = usePostFeedback()
    const submitFeedback = async () => {
        postFeedback({ feedback: feedback })
        dispatch(setShowModal(ModalEnum.NONE))
    }
    const closeModal = () => {
        dispatch(setShowModal(ModalEnum.NONE))
    }
    return (
        <FeedbackViewContainer>
            <FeedbackHeader>
                <TitleMedium>Got feedback?</TitleMedium>
                <SubtitleSmall>Let us know how we can improve!</SubtitleSmall>
            </FeedbackHeader>
            <TitleSmall>Feedback</TitleSmall>
            <TextAreaContainer>
                <TextArea value={feedback} placeholder="Type in your feedback here." setValue={setFeedback} />
            </TextAreaContainer>
            <ButtonContainer>
                <GTButton onClick={submitFeedback} value="Send feedback" color={Colors.purple._1} />
                <GTButton onClick={closeModal} value="Cancel" styleType="secondary" />
            </ButtonContainer>
        </FeedbackViewContainer>
    )
}

export default FeedbackView

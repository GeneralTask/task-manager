import React, { useState } from 'react'
import styled from 'styled-components/native'
import { Spacing } from '../../styles'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { Title, TitleSmall } from '../atoms/title/Title'
import TextArea from '../atoms/TextArea'
import ModalButton from '../atoms/buttons/RoundedGeneralButton'
import { usePostFeedbackMutation } from '../../services/generalTaskApi'
import { useAppDispatch } from '../../redux/hooks'
import { setShowModal } from '../../redux/tasksPageSlice'
import { ModalEnum } from '../../utils/enums'

const FeedbackViewContainer = styled.View`
    display: flex;
    flex-direction: column;
    height: 100%;
`

const FeedbackHeader = styled.View`
    margin-bottom: ${Spacing.margin.large}px;
`
const MarginTop = styled.View`
    flex: 1;
    margin-top: ${Spacing.margin.xSmall}px;
`
const ButtonContainer = styled.View`
    display: flex;
    flex-direction: row;
    margin-top: ${Spacing.margin.small}px;
    gap: ${Spacing.margin.small}px;
`

const FeedbackView = () => {
    const dispatch = useAppDispatch()
    const [feedback, setFeedback] = useState('')
    const [postFeedback] = usePostFeedbackMutation()
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
                <Title>Got feedback?</Title>
                <SubtitleSmall>Let us know how we can improve!</SubtitleSmall>
            </FeedbackHeader>
            <TitleSmall>Feedback</TitleSmall>
            <MarginTop>
                <TextArea value={feedback} setValue={setFeedback} />
            </MarginTop>
            <ButtonContainer>
                <ModalButton onPress={submitFeedback} value="Send feedback" isColored />
                <ModalButton onPress={closeModal} value="Cancel" isColored={false} />
            </ButtonContainer>
        </FeedbackViewContainer >
    )
}

export default FeedbackView

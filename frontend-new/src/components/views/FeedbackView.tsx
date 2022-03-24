import React, { useState } from 'react'
import styled from 'styled-components/native'
import { Colors, Spacing } from '../../styles'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { TitleMedium, TitleSmall } from '../atoms/title/Title'
import TextArea from '../atoms/TextArea'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import { usePostFeedbackMutation } from '../../services/generalTaskApi'
import { useAppDispatch } from '../../redux/hooks'
import { setShowModal } from '../../redux/tasksPageSlice'
import { ModalEnum } from '../../utils/enums'

const FeedbackViewContainer = styled.View`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: ${Spacing.padding.medium}px;
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
                <TitleMedium>Got feedback?</TitleMedium>
                <SubtitleSmall>Let us know how we can improve!</SubtitleSmall>
            </FeedbackHeader>
            <TitleSmall>Feedback</TitleSmall>
            <MarginTop>
                <TextArea value={feedback} placeholder="Type in your feedback here." setValue={setFeedback} />
            </MarginTop>
            <ButtonContainer>
                <RoundedGeneralButton onPress={submitFeedback} value="Send feedback" color={Colors.purple._1} />
                <RoundedGeneralButton onPress={closeModal} value="Cancel" hasBorder textStyle="dark" />
            </ButtonContainer>
        </FeedbackViewContainer>
    )
}

export default FeedbackView

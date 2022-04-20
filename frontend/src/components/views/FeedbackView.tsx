import { Colors, Spacing } from '../../styles'
import React, { useState } from 'react'
import { TitleMedium, TitleSmall } from '../atoms/title/Title'
import { ModalEnum } from '../../utils/enums'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import { SubtitleSmall } from '../atoms/subtitle/Subtitle'
import { TextArea } from '@atoms'
import { setShowModal } from '../../redux/tasksPageSlice'
import styled from 'styled-components'
import { useAppDispatch } from '../../redux/hooks'
import { usePostFeedback } from '../../services/api-query-hooks'

const FeedbackViewContainer = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: ${Spacing.padding._16}px;
    box-sizing: border-box;
`
const FeedbackHeader = styled.div`
    margin-bottom: ${Spacing.margin._24}px;
    display: flex;
    flex-direction: column;
`
const MarginTop = styled.div`
    flex: 1;
    margin-top: ${Spacing.margin._4}px;
`
const ButtonContainer = styled.div`
    display: flex;
    flex-direction: row;
    margin-top: ${Spacing.margin._8}px;
    gap: ${Spacing.margin._8}px;
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

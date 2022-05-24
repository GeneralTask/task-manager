import React from 'react'
import { useAppDispatch } from '../../redux/hooks'
import { setShowModal } from '../../redux/tasksPageSlice'
import { Colors } from '../../styles'
import { ModalEnum } from '../../utils/enums'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import FeedbackView from '../views/FeedbackView'
import ModalView from '../views/ModalView'

const FeedbackButton = () => {
    const dispatch = useAppDispatch()
    const openModal = () => {
        dispatch(setShowModal(ModalEnum.FEEDBACK))
    }
    return (
        <>
            <RoundedGeneralButton value="Share your feedback?" color={Colors.purple._1} onClick={openModal} />
            <ModalView>
                <FeedbackView />
            </ModalView>
        </>
    )
}

export default FeedbackButton

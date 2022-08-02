import React from 'react'
import { useAppDispatch } from '../../redux/hooks'
import { setShowModal } from '../../redux/tasksPageSlice'
import { ModalEnum } from '../../utils/enums'
import GTButton from '../atoms/buttons/GTButton'
import FeedbackView from '../views/FeedbackView'
import ModalView from '../views/ModalView'

const FeedbackButton = () => {
    const dispatch = useAppDispatch()
    const openModal = () => {
        dispatch(setShowModal(ModalEnum.FEEDBACK))
    }
    return (
        <>
            <GTButton value="Share feedback" styleType="secondary" onClick={openModal} />
            <ModalView>
                <FeedbackView />
            </ModalView>
        </>
    )
}

export default FeedbackButton

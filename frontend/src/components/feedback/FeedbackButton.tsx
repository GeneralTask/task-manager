import React from 'react'
import styled from 'styled-components'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setShowModal } from '../../redux/tasksPageSlice'
import FeedbackModal from './FeedbackModal'
import GeneralTaskModal from '../modal/GeneralTaskModal'
import { ACCENT_MAIN, BLACK, GRAY_100, SHADOW_MISC_2, WHITE } from '../../helpers/styles'
import { ModalEnum } from '../../helpers/enums'

const FeedbackButtonContainer = styled.button<{ white?: boolean }>`
    position: relative;
    color: ${(props) => (props.white ? BLACK : WHITE)};
    background-color: ${(props) => (props.white ? WHITE : ACCENT_MAIN)};
    border: ${(props) => (props.white ? `1px solid ${GRAY_100};` : 'none')};
    cursor: pointer;
    box-shadow: ${SHADOW_MISC_2};
    border-radius: 12px;
    padding: 8px 14px;
    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: 600;
    font-size: 15px;
    line-height: 20px;
    width: 100%;
    margin-left: auto;
`

const FeedbackButton = (): JSX.Element => {
    const { showModal } = useAppSelector((state) => ({ showModal: state.tasks_page.modals.show_modal }))
    const dispatch = useAppDispatch()
    const clickHandler = () => {
        dispatch(setShowModal(ModalEnum.FEEDBACK))
    }
    function afterModalOpen() {
        dispatch(setShowModal(ModalEnum.FEEDBACK))
    }
    function afterModalClose() {
        dispatch(setShowModal(ModalEnum.NONE))
    }
    return (
        <>
            <FeedbackButtonContainer onClick={clickHandler}>Share your feedback?</FeedbackButtonContainer>
            {showModal === ModalEnum.FEEDBACK &&
                <GeneralTaskModal
                    render={<FeedbackModal />}
                    canClickOutside={true}
                    showModal={true}
                    afterModalOpen={afterModalOpen}
                    afterModalClose={afterModalClose}
                />
            }
        </>
    )
}

export default FeedbackButton

import React from 'react'
import styled from 'styled-components'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setShowModal } from '../../redux/tasksPageSlice'
import FeedbackModal from './FeedbackModal'
import GeneralTaskModal from '../modal/GeneralTaskModal'

const FeedbackButtonContainer = styled.button<{ white?: boolean }>`
    position: relative;
    color: ${(props) => props.white ? 'black' : 'white'};
    background-color: ${(props) => props.white ? 'white' : '#5C31D7'};
    border: ${(props) => props.white ? ' 1px solid #F4F4F5;' : 'none'};
	cursor: pointer;
    box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.07);
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
    const { showModal } = useAppSelector((state) => ({ showModal: state.tasks_page.events.show_modal }))
    const dispatch = useAppDispatch()
    const clickHandler = () => {
        dispatch(setShowModal(true))
    }
    function afterModalOpen() {
        dispatch(setShowModal(true))
    }
    function afterModalClose() {
        dispatch(setShowModal(false))
    }
    return (
        <>
            <FeedbackButtonContainer onClick={clickHandler}>Share your feedback?</FeedbackButtonContainer>
            <GeneralTaskModal
                render={<FeedbackModal />}
                showModal={showModal}
                afterModalOpen={afterModalOpen}
                afterModalClose={afterModalClose}
            />
        </>
    )
}

export default FeedbackButton

import React from 'react'
import styled from 'styled-components'
import { ModalEnum } from '../../helpers/enums'
import { BLACK, WHITE, ACCENT_MAIN, GRAY_100, SHADOW_MISC_2 } from '../../helpers/styles'
import { makeAuthorizedRequest } from '../../helpers/utils'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setShowModal } from '../../redux/tasksPageSlice'
import GeneralTaskModal from '../modal/GeneralTaskModal'
import { ButtonContainer, HeaderPrimary, HeaderSecondary, ModalButton, ModalTextArea, ResponseContainer, SectionHeader } from '../modal/ModalElements'
import { ModalContainer, PrivacyPolicyHeader } from './PrivacyPolicyModal-style'

const PrivacyPolicyModal = (): JSX.Element => {
    const dispatch = useAppDispatch()

    document.getElementById('root')?.style.setProperty('filter', 'blur(5px)')
    document.getElementById('root')?.style.setProperty('overflow', 'hidden')

    const closeModal = () => {
        dispatch(setShowModal(ModalEnum.NONE))
    }
    const handleSubmit = async () => {
        await makeAuthorizedRequest({
            url: '', // TODO: add url
            method: 'POST',
            body: JSON.stringify({ accepted: true }),
        })
        closeModal()
    }

    return (
        <ModalContainer>
            <PrivacyPolicyHeader>
                <HeaderPrimary>Please look at our Privacy Policy.</HeaderPrimary>
                <HeaderSecondary>please</HeaderSecondary>
            </PrivacyPolicyHeader>
            <ResponseContainer>
                <SectionHeader>Privacy Policy</SectionHeader>
                <ModalTextArea value={'PRIVACY_POLICY'} disabled />
            </ResponseContainer>
            <ButtonContainer>
                <ModalButton onClick={handleSubmit}>I Agree</ModalButton>
            </ButtonContainer>
        </ModalContainer>
    )
}

const PPButtonContainer = styled.button<{ white?: boolean }>`
    position: relative;
    color: ${(props) => props.white ? BLACK : WHITE};
    background-color: ${(props) => props.white ? WHITE : ACCENT_MAIN};
    border: ${(props) => props.white ? `1px solid ${GRAY_100};` : 'none'};
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

export const PPButton = (): JSX.Element => {
    const { showModal } = useAppSelector((state) => ({ showModal: state.tasks_page.modals.show_modal }))
    const dispatch = useAppDispatch()
    const clickHandler = () => {
        dispatch(setShowModal(ModalEnum.PRIVACY_POLICY))
    }
    function afterModalOpen() {
        console.log('modal opened')
        dispatch(setShowModal(ModalEnum.PRIVACY_POLICY))
    }
    function afterModalClose() {
        dispatch(setShowModal(ModalEnum.NONE))
    }
    return (
        <>
            <PPButtonContainer onClick={clickHandler}>View PP temp</PPButtonContainer>
            {showModal === ModalEnum.PRIVACY_POLICY &&
                <GeneralTaskModal
                    render={<PrivacyPolicyModal />}
                    showModal={true}
                    afterModalOpen={afterModalOpen}
                    afterModalClose={afterModalClose}
                />
            }
        </>
    )
}

export default PrivacyPolicyModal

import React from 'react'
import Modal from 'react-modal'
import { MODAL_HEIGHT, MODAL_WIDTH, SHADOW_MISC_1, WHITE } from '../../helpers/styles'

if (process.env.NODE_ENV !== 'test') Modal.setAppElement('#root')

const MODAL_STYLE: Modal.Styles = {
    overlay: {
        backgroundColor: 'transparent',
    },
    content: {
        position: 'absolute',
        width: MODAL_WIDTH,
        height: MODAL_HEIGHT,
        marginLeft: 'auto',
        marginRight: 'auto',
        border: 'none',
        backgroundColor: WHITE,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        borderRadius: '12px',
        boxShadow: SHADOW_MISC_1,
        top: '20%',
    }
}

interface GeneralTaskModalProps {
    render: JSX.Element,
    showModal: boolean,
    canClickOutside: boolean,
    afterModalClose: () => void,
    afterModalOpen: () => void,
}

const GeneralTaskModal = (props: GeneralTaskModalProps): JSX.Element => {
    const modalOpen = () => {
        document.getElementById('root')?.style.setProperty('filter', 'blur(5px)')
        document.getElementById('root')?.style.setProperty('overflow', 'hidden')
        props.afterModalOpen()
    }
    const modalClose = () => {
        document.getElementById('root')?.style.removeProperty('filter')
        document.getElementById('root')?.style.removeProperty('overflow')
        props.afterModalClose()
    }
    return (
        <Modal style={MODAL_STYLE}
            isOpen={props.showModal}
            shouldCloseOnOverlayClick={props.canClickOutside}
            onRequestClose={modalClose}
            onAfterOpen={modalOpen}
            onAfterClose={modalClose}>
            {props.render}
        </Modal>
    )
}

export default GeneralTaskModal

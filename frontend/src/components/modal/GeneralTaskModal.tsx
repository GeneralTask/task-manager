import React from 'react'
import Modal from 'react-modal'

Modal.setAppElement('#root')

const MODAL_STYLE: Modal.Styles = {
    overlay: {
        backgroundColor: 'transparent',
    },
    content: {
        position: 'absolute',
        width: '365px',
        height: '418px',
        marginLeft: 'auto',
        marginRight: 'auto',
        border: 'none',
        backgroundColor: 'white',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        borderRadius: '12px',
        boxShadow: '0px 4px 20px rgba(43, 43, 43, 0.08)',
        top: '50%',
        transform: 'translateY(-75%)',
    }
}

interface GeneralTaskModalProps {
    render: JSX.Element,
    showModal: boolean,
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
            onRequestClose={modalClose}
            onAfterOpen={modalOpen}
            onAfterClose={modalClose}>
            {props.render}
        </Modal>
    )
}

export default GeneralTaskModal

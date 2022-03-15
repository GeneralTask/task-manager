import React from 'react'
import Modal from 'react-modal'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { ModalEnum } from '../../utils/enums'
import { setShowModal } from '../../redux/tasksPageSlice'
import { Colors } from '../../styles'

const MODAL_WIDTH = '365px'
const MODAL_HEIGHT = '418px'
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
        backgroundColor: Colors.white,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        borderRadius: '12px',
        boxShadow: '0px 4px 20px rgba(43, 43, 43, 0.08)',
        top: '20%',
    },
}
interface ModalViewProps {
    children: JSX.Element
}
const ModalView = ({ children }: ModalViewProps) => {
    const { showModal: currentModal } = useAppSelector((state) => ({ showModal: state.tasks_page.modals.show_modal }))
    const dispatch = useAppDispatch()

    const blurBackground = () => {
        document.getElementById('root')?.style.setProperty('filter', 'blur(5px)')
        document.getElementById('root')?.style.setProperty('overflow', 'hidden')
    }
    const unblurBackground = () => {
        document.getElementById('root')?.style.setProperty('filter', 'blur(0px)')
        document.getElementById('root')?.style.setProperty('overflow', 'auto')
    }
    const modalClose = () => {
        dispatch(setShowModal(ModalEnum.NONE))
    }
    return (
        <Modal
            style={MODAL_STYLE}
            isOpen={currentModal !== ModalEnum.NONE}
            onAfterOpen={blurBackground}
            onAfterClose={unblurBackground}
            onRequestClose={modalClose}
            appElement={document.body}
        >
            {children}
        </Modal>
    )
}

export default ModalView

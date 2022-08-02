import React from 'react'
import Modal from 'react-modal'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { setShowModal } from '../../redux/tasksPageSlice'
import { Colors, Dimensions } from '../../styles'
import { TModalSize } from '../../styles/dimensions'
import { ModalEnum } from '../../utils/enums'

const SHARED_MODAL_OVERLAY_STYLE: React.CSSProperties = {
    backgroundColor: 'transparent',
    overflow: 'scroll',
}
const SHARED_MODAL_CONTENT_STYLE: React.CSSProperties = {
    position: 'absolute',
    marginLeft: 'auto',
    marginRight: 'auto',
    border: 'none',
    backgroundColor: Colors.background.white,
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
    borderRadius: '12px',
    boxShadow: '0px 4px 20px rgba(43, 43, 43, 0.08)',
    top: '20%',
    padding: '0px',
}

const getModalStyle = (modalSize: TModalSize): Modal.Styles => {
    const width = Dimensions.modalSize[modalSize].width
    const height = Dimensions.modalSize[modalSize].height
    return {
        overlay: SHARED_MODAL_OVERLAY_STYLE,
        content: {
            ...SHARED_MODAL_CONTENT_STYLE,
            width,
            height,
        },
    }
}

interface ModalViewProps {
    children: JSX.Element
    size?: 'small' | 'medium'
    canClose?: boolean
}
const ModalView = ({ children, size, canClose }: ModalViewProps) => {
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
        if (canClose != null && !canClose) return
        dispatch(setShowModal(ModalEnum.NONE))
    }
    const modalStyle = size ? getModalStyle(size) : getModalStyle('small')
    return (
        <Modal
            style={modalStyle}
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

import { ToastContainer, ToastPosition } from 'react-toastify'
import styled from 'styled-components'
import { cssTransition } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import 'animate.css'
import { Border, Colors, Shadows } from '../../../styles'

const toastAnimation = cssTransition({
    enter: 'animate__animated animate__fadeInRight',
    exit: 'animate__animated animate__fadeOutRight',
})

const DEFAULT_TOAST_PROPS = {
    hideProgressBar: true,
    position: 'bottom-right' as ToastPosition,
    transition: toastAnimation,
}

const StyledToastContainer = styled(ToastContainer).attrs({
    className: 'toast-container',
    toastClassName: 'toast',
    bodyClassName: 'toast-body',
    ...DEFAULT_TOAST_PROPS,
})`
    --toastify-toast-width: fit-content;
    .toast {
        background-color: ${Colors.background.black};
        box-shadow: ${Shadows.medium};
        border-radius: ${Border.radius.small};
    }
    .toast-body {
        color: ${Colors.text.white};
        position: relative;
        padding: 0;
        min-width: 100%;
        display: initial;
    }
`

export default StyledToastContainer

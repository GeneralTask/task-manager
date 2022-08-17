import { ToastContainer, ToastPosition } from 'react-toastify'
import styled from 'styled-components'
import { cssTransition } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import 'animate.css'
import { Colors, Border, Typography } from '../../../styles'

const toastAnimation = cssTransition({
    enter: 'animate__animated animate__fadeInRight',
    exit: 'animate__animated animate__fadeOutRight',
})

export const DEFAULT_PROPS = {
    hideProgressBar: true,
    position: 'bottom-right' as ToastPosition,
    transition: toastAnimation,
}

const StyledToastContainer = styled(ToastContainer).attrs({
    className: 'toast-container',
    toastClassName: 'toast',
    bodyClassName: 'toast-body',
})`
    --toastify-toast-width: fit-content;
    .toast {
        background-color: ${Colors.background.black};
        border-radius: ${Border.radius.large};
    }
    .toast-body {
        color: ${Colors.text.white};
        position: relative;
        padding: 0;
        min-width: 100%;
        display: initial;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu,
            Cantarell, Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji',
            'Segoe UI Symbol';
        ${Typography.bodySmall};
    }
`

export default StyledToastContainer

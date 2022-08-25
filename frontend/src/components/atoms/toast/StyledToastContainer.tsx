import { ToastContainer } from 'react-toastify'
import styled from 'styled-components'
import { cssTransition } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import 'animate.css'
import { Border, Colors, Shadows } from '../../../styles'

const toastAnimation = cssTransition({
    enter: 'animate__animated animate__fadeInRight',
    exit: 'animate__animated animate__fadeOutRight',
})

const StyledToastContainer = styled(ToastContainer).attrs({
    className: 'toast-container',
    toastClassName: 'toast',
    bodyClassName: 'toast-body',
    hideProgressBar: true,
    position: 'bottom-right',
    transition: toastAnimation,
    closeButton: false,
    newestOnTop: true,
})`
    --toastify-toast-width: fit-content;
    --toastify-color-light: ${Colors.background.white};
    --toastify-color-dark: ${Colors.background.black};
    --toastify-text-color-light: ${Colors.text.black};
    --toastify-text-color-dark: ${Colors.text.white};
    .toast {
        box-shadow: ${Shadows.medium};
        border-radius: ${Border.radius.small};
        width: 400px;
    }
    .toast-body {
        position: relative;
        padding: 0;
        min-width: 100%;
        display: initial;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu,
            Cantarell, Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji',
            'Segoe UI Symbol';
    }
`

export default StyledToastContainer

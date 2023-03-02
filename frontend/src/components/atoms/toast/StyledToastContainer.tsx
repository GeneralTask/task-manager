import { CloseButtonProps, ToastContainer } from 'react-toastify'
import { cssTransition } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import 'animate.css'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../../styles'
import { icons } from '../../../styles/images'
import { Icon } from '../Icon'
import NoStyleButton from '../buttons/NoStyleButton'

const ButtonMarginLeft = styled(NoStyleButton)`
    margin-left: ${Spacing._8};
`

const CloseButton = ({ closeToast, theme }: CloseButtonProps) => (
    <ButtonMarginLeft onClick={closeToast}>
        <Icon icon={icons.x} color={theme === 'light' ? 'black' : 'white'} />
    </ButtonMarginLeft>
)

const toastAnimation = cssTransition({
    enter: 'animate__animated animate__pulse',
    exit: 'animate__animated animate__fadeOutRight',
})

const StyledToastContainer = styled(ToastContainer).attrs({
    className: 'toast-container',
    toastClassName: 'toast',
    bodyClassName: 'toast-body',
    hideProgressBar: true,
    position: 'bottom-right',
    transition: toastAnimation,
    closeButton: CloseButton,
    newestOnTop: true,
})`
    --toastify-toast-width: 400px;
    --toastify-color-light: ${Colors.background.white};
    --toastify-color-dark: ${Colors.background.black};
    --toastify-text-color-light: ${Colors.text.black};
    --toastify-text-color-dark: ${Colors.text.white};
    .toast {
        box-shadow: ${Shadows.medium};
        border-radius: ${Border.radius.medium};
        cursor: auto;
    }
    .toast-body {
        position: relative;
        padding: 0;
        display: initial;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif, 'Segoe UI', Helvetica, Roboto, Oxygen, Ubuntu,
            Cantarell, Arial, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'Apple Color Emoji', 'Segoe UI Emoji',
            'Segoe UI Symbol';
        min-width: 0;
    }
`

export default StyledToastContainer

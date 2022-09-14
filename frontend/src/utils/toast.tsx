import { Id as ToastId, ToastOptions, toast as toastifyToast } from 'react-toastify'
import ToastTemplate, { ToastTemplateProps } from '../components/atoms/toast/ToastTemplate'

const toast = (toastTemplateProps: ToastTemplateProps, options?: ToastOptions): ToastId => {
    return toastifyToast(<ToastTemplate {...toastTemplateProps} />, options)
}

const updateToast = (id: ToastId, toastTemplateProps: ToastTemplateProps, options?: ToastOptions): void => {
    return toastifyToast.update(id, { render: <ToastTemplate {...toastTemplateProps} />, ...options })
}

const dismissToast = toastifyToast.dismiss
const isActive = toastifyToast.isActive

export { updateToast, isActive, dismissToast }
export default toast

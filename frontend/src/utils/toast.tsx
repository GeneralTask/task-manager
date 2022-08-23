import { Id, ToastOptions, toast as toastifyToast } from 'react-toastify'
import ToastTemplate, { ToastTemplateProps } from '../components/atoms/toast/ToastTemplate'

import React from 'react'

export type ToastId = Id

export const dismissToast = toastifyToast.dismiss

const toast = (toastTemplateProps: ToastTemplateProps, options?: ToastOptions): ToastId => {
    return toastifyToast(<ToastTemplate {...toastTemplateProps} />, options)
}

const updateToast = (id: ToastId, toastTemplateProps: ToastTemplateProps, options?: ToastOptions): void => {
    return toastifyToast.update(id, { render: <ToastTemplate {...toastTemplateProps} />, ...options })
}

const isActive = toastifyToast.isActive

export { updateToast, isActive }
export default toast

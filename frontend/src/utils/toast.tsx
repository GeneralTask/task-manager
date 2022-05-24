import { Id, ToastOptions, toast as toastifyToast } from 'react-toastify'
import ToastTemplate, { ToastTemplateProps } from '../components/atoms/toast/ToastTemplate'

import React from 'react'

export type ToastId = Id

export const dismissToast = toastifyToast.dismiss

const toast = (toastTemplateProps: ToastTemplateProps, options?: ToastOptions): ToastId => {
    return toastifyToast(<ToastTemplate {...toastTemplateProps} />, options)
}

export default toast

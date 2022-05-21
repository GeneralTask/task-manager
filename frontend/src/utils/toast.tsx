import { Id, toast as toastifyToast } from 'react-toastify'
import ToastTemplate, { ToastTemplateProps } from '../components/atoms/toast/ToastTemplate'

import React from 'react'

export type ToastId = Id

export const dismissToast = toastifyToast.dismiss

const toast = (props: ToastTemplateProps): ToastId => {
    return toastifyToast(<ToastTemplate {...props} />)
}

export default toast

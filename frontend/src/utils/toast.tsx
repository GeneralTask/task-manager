import React from 'react'
import { toast as toastifyToast } from 'react-toastify'
import ToastTemplate, { ToastTemplateProps } from '../components/atoms/toast/ToastTemplate'

const toast = (props: ToastTemplateProps) => {
    toastifyToast(<ToastTemplate {...props} />)
}

export default toast

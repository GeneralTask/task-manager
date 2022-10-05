import { useRef } from 'react'
import { Id as ToastId, ToastOptions, toast as toastifyToast } from 'react-toastify'
import ToastTemplate, { ToastTemplateProps } from '../components/atoms/toast/ToastTemplate'

interface ToastArgs extends ToastTemplateProps {
    undoableAction?: () => void
    undoButtonLabel?: string
}

const useToast = () => {
    const toastIdRef = useRef<ToastId>()
    const hasBeenDismissed = useRef<boolean>(false)

    const isActive = () => {
        if (toastIdRef.current) {
            return toastifyToast.isActive(toastIdRef.current)
        }
        return false
    }

    const update = (toastTemplateProps: ToastTemplateProps, options?: ToastOptions): void => {
        if (toastIdRef.current) {
            return toastifyToast.update(toastIdRef.current, {
                render: <ToastTemplate {...toastTemplateProps} />,
                ...options,
            })
        }
    }

    const dismiss = () => {
        if (toastIdRef.current) {
            toastifyToast.dismiss(toastIdRef.current)
            hasBeenDismissed.current = true
        }
    }

    const show = (toastTemplateProps: ToastArgs, options: ToastOptions = {}) => {
        if (toastTemplateProps.rightAction?.undoableAction) {
            const initialOnClose = options.onClose
            options.onClose = () => {
                if (!hasBeenDismissed.current) {
                    dismiss()
                    toastTemplateProps.rightAction?.undoableAction?.()
                }
                initialOnClose?.(null) // if an onClose was already provided, call it
            }
        }
        toastIdRef.current = toastifyToast(<ToastTemplate {...toastTemplateProps} />, options)
    }

    return { show, update, isActive, dismiss }
}

export default useToast

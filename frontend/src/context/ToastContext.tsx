import { ReactNode, createContext, useContext, useState } from 'react'
import { Provider as ToastProvider } from '@radix-ui/react-toast'
import { TToast, ToastId, ToastProps, ToastViewport } from '../components/radix/Toast'
import { TOAST_DEFAULT_DURATION } from '../constants'
import { useRadixToast } from '../hooks'
import { emptyFunction } from '../utils/utils'

// const useToasts = () => {
//     const [toasts, setToasts] = useState<TToast[]>([])

//     const renderedToasts = toasts.map((toast) => toast.render)

//     const show = (toastProps: ToastProps) => {
//         const id = uuidv4()
//         setToasts([...toasts, {
//             ToastId: id,
//             render: <Toast {...toastProps} key={id} />
//         }])
//         console.log(toasts)

//     }

//     return { renderedToasts, show }
// }

// export default useToasts

interface TToastContext {
    toasts: TToast[]
    showToast: (toastProps: ToastProps) => ToastId
    hideToast: (toastId: string) => void
    updateToast: (toastId: string, toastProps: ToastProps) => void
    isToastActive: (toastId: string) => boolean
}

const ToastContext = createContext<TToastContext>({
    toasts: [],
    showToast: () => '',
    hideToast: emptyFunction,
    updateToast: emptyFunction,
    isToastActive: () => false,
})

interface ToastContextProps {
    children: ReactNode
}

export const ToastContextProvider = ({ children }: ToastContextProps) => {
    const [toasts, setToasts] = useState<TToast[]>([])
    const { createToast } = useRadixToast()

    const showToast = (toastProps: ToastProps) => {
        const newToast = createToast(toastProps)
        console.log('created toast')
        setToasts([...toasts, newToast])
        return newToast.id
    }

    // useEffect(() => {
    //     const handleKeyDown = (e: KeyboardEvent) => {
    //         const key = getKeyCode(e)
    //         const shortcut = activeKeyboardShortcuts.get(key)
    //         if (shortcut) {
    //             setShowCommandPalette(false)
    //             shortcut.action()
    //             if (key !== 'Escape') {
    //                 e.preventDefault()
    //             }
    //         }
    //     }
    //     document.addEventListener('keydown', handleKeyDown)
    //     return () => {
    //         document.removeEventListener('keydown', handleKeyDown)
    //     }
    // }, [activeKeyboardShortcuts])

    const value = {
        toasts,
        showToast,
        hideToast: emptyFunction,
        updateToast: emptyFunction,
        isToastActive: () => false,
    }

    return (
        <ToastContext.Provider value={value}>
            <ToastProvider duration={TOAST_DEFAULT_DURATION}>
                {children}
                {toasts.map((toast) => toast.render)}
                <ToastViewport />
            </ToastProvider>
        </ToastContext.Provider>
    )
}

const useToastContext = () => useContext(ToastContext)

export default useToastContext

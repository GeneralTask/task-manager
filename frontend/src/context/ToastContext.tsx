import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import Toast, { TToast, ToastProps } from '../components/radix/Toast'
import { TShortcut } from '../utils/types'
import { emptyFunction, getKeyCode } from '../utils/utils'

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
    showToast: (toastProps: ToastProps) => void
    hideToast: (toastId: string) => void
    updateToast: (toastId: string, toastProps: ToastProps) => void
    isToastActive: (toastId: string) => boolean
}

const ToastContext = createContext<TToastContext>({
    toasts: [],
    showToast: emptyFunction,
    hideToast: emptyFunction,
    updateToast: emptyFunction,
    isToastActive: () => false,
})

interface ToastContextProps {
    children: ReactNode
}

export const ToastContextProvider = ({ children }: ToastContextProps) => {
    const [toasts, setToasts] = useState<TToast[]>([])

    const showToast = (toastProps: ToastProps) => {
        const toastId = uuidv4()
        setToasts([...toasts])
    }

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = getKeyCode(e)
            const shortcut = activeKeyboardShortcuts.get(key)
            if (shortcut) {
                setShowCommandPalette(false)
                shortcut.action()
                if (key !== 'Escape') {
                    e.preventDefault()
                }
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [activeKeyboardShortcuts])

    return (
        <ToastContext.Provider
            value={{
                showCommandPalette,
                activeKeyboardShortcuts,
                setShowCommandPalette,
                setActiveKeyboardShortcuts,
            }}
        >
            {children}
        </ToastContext.Provider>
    )
}

const useToastContext = () => useContext(ToastContext)

export default useToastContext

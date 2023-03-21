import { v4 as uuidv4 } from 'uuid'
import Toast, { TToast, ToastProps } from '../components/radix/Toast'

const useRadixToast = () => {
    const createToast = (props: ToastProps): TToast => {
        const id = uuidv4()
        const toast = <Toast {...props} />
        return { id, render: toast }
    }

    return { createToast }
}

export default useRadixToast

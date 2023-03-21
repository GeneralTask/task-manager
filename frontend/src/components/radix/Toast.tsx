import * as ToastPrimitive from '@radix-ui/react-toast'
import styled from 'styled-components'
import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'

export const ToastViewport = styled(ToastPrimitive.Viewport)`
    --viewport-padding: 25px;
    position: fixed;
    bottom: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    padding: var(--viewport-padding);
    gap: 10px;
    width: 390px;
    max-width: 100vw;
    margin: 0;
    list-style: none;
    z-index: 2147483647;
    outline: none;
`

export type ToastId = string
export interface TToast {
    id: ToastId
    // isOpen: boolean
    // setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
    render: React.ReactNode
}

export interface ToastProps {
    id: ToastId
    title: string
    description: string
    actionText: string
    onActionClick: () => void
    onClose: () => void
    // isOpen: boolean
    // setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
}
const Toast = (props: ToastProps) => {
    return (
        <ToastPrimitive.Root key={props.id}>
            <ToastPrimitive.Title>{props.title}</ToastPrimitive.Title>
            <ToastPrimitive.Description>{props.description}</ToastPrimitive.Description>
            <ToastPrimitive.Action altText={props.actionText} asChild>
                <GTButton styleType="secondary" value={props.actionText} onClick={props.onActionClick} />
            </ToastPrimitive.Action>
            <ToastPrimitive.Close asChild>
                <GTButton styleType="icon" icon={icons.x} />
            </ToastPrimitive.Close>
        </ToastPrimitive.Root>
    )
}

export default Toast

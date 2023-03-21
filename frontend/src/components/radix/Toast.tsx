import { useState } from 'react'
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

export interface TToast {
    id: string
    isOpen: boolean
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
    render: React.ReactNode
}

export interface ToastProps {
    id: string
    title: string
    description: string
    actionText: string
    onActionClick: () => void
    onClose: () => void
}
const Toast = (props: ToastProps): TToast => {
    const { id } = props
    const [isOpen, setIsOpen] = useState(true)

    const render = (
        <ToastPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
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
    return { id, isOpen, setIsOpen, render }
}

export default Toast

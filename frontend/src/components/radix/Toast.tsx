import * as ToastPrimitive from '@radix-ui/react-toast'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import Flex from '../atoms/Flex'

const ToastRoot = styled(ToastPrimitive.Root)`
    display: flex;
    background: ${Colors.background.white};
    border: ${Border.stroke.large} solid ${Colors.border.purple};
    border-radius: ${Border.radius.small};
    padding: ${Spacing._12};
    box-shadow: ${Shadows.medium};
    box-sizing: border-box;
    &[data-state='open'] {
        animation: in 200ms ease;
    }
    @keyframes in {
        from {
            opacity: 0;
            transform: translateX(75%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    &[data-state='closed'] {
        animation: out 200ms ease;
    }
    @keyframes out {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(75%);
        }
    }
`
const ToastTitle = styled(ToastPrimitive.Title)`
    ${Typography.truncated};
    ${Typography.body};
    ${Typography.bold};
`
const ToastDescription = styled(ToastPrimitive.Description)`
    color: ${Colors.text.light};
    ${Typography.truncated};
    ${Typography.bodySmall};
`
const ToastAction = styled(ToastPrimitive.Action)`
    all: unset;
`

interface ToastProps {
    title: string
    body: string
    action?: React.ReactNode
    open?: boolean
    onOpenChange?: React.Dispatch<React.SetStateAction<boolean>>
    type?: 'foreground' | 'background'
    duration?: number // length in milliseconds
}

const Toast = (props: ToastProps) => {
    const { title, body, action, open, onOpenChange, type, duration } = props

    return (
        <ToastRoot {...{ open, onOpenChange, type, duration }}>
            <Flex column minWidth="0">
                <ToastTitle>{title}</ToastTitle>
                <ToastDescription>{body}</ToastDescription>
            </Flex>
            <Flex alignItems="center">
                <ToastAction altText="Perform toast action">{action}</ToastAction>
            </Flex>
        </ToastRoot>
    )
}

export default Toast

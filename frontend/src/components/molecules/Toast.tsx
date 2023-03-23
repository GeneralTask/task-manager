import { Toast as HotToast, ToastType, toast } from 'react-hot-toast'
import styled, { keyframes } from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import Flex from '../atoms/Flex'
import { Icon, TIconType } from '../atoms/Icon'
import GTButton from '../atoms/buttons/GTButton'

const OuterContainer = styled.div<{ backgroundColor: string; visible: boolean }>`
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing._8};
    padding: ${Spacing._16};
    min-height: ${Spacing._48};
    max-width: 400px;
    border: ${Border.stroke.medium} solid ${Colors.background.border};
    border-radius: ${Border.radius.small};
    background-color: ${({ backgroundColor }) => backgroundColor};
    box-shadow: ${Shadows.l};
    color: ${Colors.text.base};
    opacity: ${({ visible }) => (visible ? 1 : 0)};
    animation: ${({ visible }) => (visible ? enter : leave)} 0.2s ease-in-out;
    ${Typography.body.small};
`

const enter = keyframes`
    from {
        transform: scale(0.9);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
`
const leave = keyframes`
    from {
        transform: scale(1);
        opacity: 1;
    }
    to {
        transform: scale(0.9);
        opacity: 0;
    }
`

interface ToastContainerProps {
    children: React.ReactNode
    toast: HotToast
}
const Toast = (props: ToastContainerProps) => {
    const { children, toast: t } = props
    const { icon, iconColor } = getIcon(t.type)
    const backgroundColor = getBgColor(t.type)

    return (
        <OuterContainer backgroundColor={backgroundColor} visible={t.visible}>
            {icon && iconColor && <Icon icon={icon} colorHex={iconColor} />}
            <Flex alignItems="center" gap={Spacing._8}>
                {children}
            </Flex>
            {t.type !== 'loading' && (
                <div>
                    <GTButton styleType="icon" icon={icons.x} onClick={() => toast.dismiss(t.id)} />
                </div>
            )}
        </OuterContainer>
    )
}

interface ToastProps {
    title?: string
    message: string
    type?: ToastType
    action?: {
        icon: TIconType
        label: string
        onClick: () => void
    }
}
export const emit = (props: ToastProps) => {
    const toastMessage = (
        <>
            <Flex column>
                {props.title && <strong>{props.title}</strong>}
                {props.message}
            </Flex>
            {props.action && (
                <div>
                    <GTButton
                        styleType="secondary"
                        value={props.action.label}
                        icon={props.action.icon}
                        onClick={props.action.onClick}
                    />
                </div>
            )}
        </>
    )
    switch (props.type) {
        case 'success':
            toast.success(toastMessage)
            return
        case 'error':
            toast.error(toastMessage)
            return
        default:
            toast(toastMessage)
    }
}

const getIcon = (type: ToastType): { icon: TIconType | null; iconColor: string | null } => {
    switch (type) {
        case 'blank':
            return { icon: icons.infoCircleSolid, iconColor: Colors.text.muted }
        case 'success':
            return { icon: icons.checkCircleSolid, iconColor: Colors.semantic.success.base }
        case 'error':
            return { icon: icons.exclamationTriangleSolid, iconColor: Colors.semantic.warning.base }
    }
    return { icon: null, iconColor: null }
}

const getBgColor = (type: ToastType): string => {
    switch (type) {
        case 'blank':
            return Colors.background.base
        case 'success':
            return Colors.semantic.success.faint
        case 'error':
            return Colors.semantic.warning.faint
    }
    return Colors.background.border
}

export default Toast

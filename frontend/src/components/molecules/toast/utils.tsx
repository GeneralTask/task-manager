import { ToastType, toast } from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'
import { Colors } from '../../../styles'
import { icons } from '../../../styles/images'
import Flex from '../../atoms/Flex'
import { TIconType } from '../../atoms/Icon'
import GTButton, { GTButtonProps } from '../../atoms/buttons/GTButton'

export interface EmitProps {
    toastId?: string
    title?: string
    message: string
    type?: ToastType
    duration?: number
    action?: GTButtonProps
    actions?: GTButtonProps[]
    undoAction?: {
        onClick: () => void
        onDismiss: () => void
    }
}
export const emit = (props: EmitProps) => {
    const { toastId, title, message, type, duration, action, actions, undoAction } = props

    const id = toastId ?? uuidv4()

    const toastContent = (
        <>
            <Flex column>
                {title && <strong>{title} </strong>}
                {message}
            </Flex>
            {action && (
                <div>
                    <GTButton {...action} />
                </div>
            )}
            {actions?.map((a, i) => (
                <div key={i}>
                    <GTButton {...a} />
                </div>
            ))}
            {undoAction && (
                <div>
                    <GTButton styleType="secondary" value="Undo" onClick={undoAction.onClick} />
                </div>
            )}
            {type !== 'loading' && (
                <div>
                    <GTButton
                        styleType="icon"
                        icon={icons.x}
                        onClick={() => {
                            undoAction?.onDismiss?.()
                            toast.dismiss(id)
                        }}
                    />
                </div>
            )}
        </>
    )

    const passProps = { id, duration }
    switch (type) {
        case 'success':
            return toast.success(toastContent, passProps)
        case 'error':
            return toast.error(toastContent, passProps)
    }
    return toast(toastContent, passProps)
}

export const getToastIcon = (type: ToastType): { icon: TIconType | null; iconColor: string | null } => {
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

export const getToastBgColor = (type: ToastType): string => {
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

import { ToastType, toast as hotToast } from 'react-hot-toast'
import { v4 as uuidv4 } from 'uuid'
import { Colors } from '../../../styles'
import { icons } from '../../../styles/images'
import Flex from '../../atoms/Flex'
import { TIconType } from '../../atoms/Icon'
import GTButton, { GTButtonProps } from '../../atoms/buttons/GTButton'

export interface ToastArgs {
    toastId?: string
    title?: string
    type?: ToastType
    duration?: number
    actions?: GTButtonProps | GTButtonProps[]
    undoAction?: {
        onClick: () => void
        onDismiss: () => void
    }
}
export const toast = (message: string, args?: ToastArgs) => {
    const { toastId, title, type, duration, actions, undoAction } = args ?? {}
    const action = !Array.isArray(actions) ? actions : null
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
            {Array.isArray(actions) &&
                actions?.map((a, i) => (
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
                            hotToast.dismiss(id)
                        }}
                    />
                </div>
            )}
        </>
    )

    const passProps = { id, duration }
    switch (type) {
        case 'success':
            return hotToast.success(toastContent, passProps)
        case 'error':
            return hotToast.error(toastContent, passProps)
    }
    return hotToast(toastContent, passProps)
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

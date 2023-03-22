import { forwardRef } from 'react'
import { Toast, ToastType } from 'react-hot-toast'
import styled from 'styled-components'
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
    border: ${Border.stroke.medium} solid ${Colors.background.border};
    border-radius: ${Border.radius.small};
    background-color: ${({ backgroundColor }) => backgroundColor};
    box-shadow: ${Shadows.l};
    color: ${Colors.text.base};
    opacity: ${({ visible }) => (visible ? 1 : 0)};
    ${Typography.body.small};
`

interface ToastContainerProps {
    children?: React.ReactNode
    toast: Toast
}
const ToastContainer = forwardRef<HTMLDivElement, ToastContainerProps>((props: ToastContainerProps, ref) => {
    const { icon, iconColor } = getIcon(props.toast.type)
    const backgroundColor = getBgColor(props.toast.type)

    return (
        <OuterContainer backgroundColor={backgroundColor} visible={props.toast.visible} ref={ref}>
            {icon && iconColor && <Icon icon={icon} colorHex={iconColor} />}
            <Flex>{props.children}</Flex>
            <GTButton styleType="icon" icon={icons.x} />
        </OuterContainer>
    )
})

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

export default ToastContainer

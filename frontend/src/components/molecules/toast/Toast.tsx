import { Toast as HotToast } from 'react-hot-toast'
import { Spacing } from '../../../styles'
import Flex from '../../atoms/Flex'
import { Icon } from '../../atoms/Icon'
import { OuterToastContainer } from './styles'
import { getToastBgColor, getToastIcon } from './utils'

interface ToastProps {
    children: React.ReactNode
    toast: HotToast
}
const Toast = ({ children, toast: t }: ToastProps) => {
    const { icon, iconColor } = getToastIcon(t.type)
    const backgroundColor = getToastBgColor(t.type)

    return (
        <OuterToastContainer backgroundColor={backgroundColor} visible={t.visible}>
            {icon && iconColor && <Icon icon={icon} colorHex={iconColor} />}
            <Flex alignItems="center" gap={Spacing._8}>
                {children}
            </Flex>
        </OuterToastContainer>
    )
}

export default Toast

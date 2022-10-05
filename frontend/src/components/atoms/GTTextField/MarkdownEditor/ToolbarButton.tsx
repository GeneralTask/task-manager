import { IconProp } from '@fortawesome/fontawesome-svg-core'
import GTIconButton from '../../buttons/GTIconButton'

interface Props {
    icon: IconProp
    action: () => void
}
const ToolbarButton = ({ icon, action }: Props) => {
    return (
        <GTIconButton onMouseDown={(e) => e.preventDefault()} icon={icon} iconColor="gray" onClick={() => action()} />
    )
}

export default ToolbarButton

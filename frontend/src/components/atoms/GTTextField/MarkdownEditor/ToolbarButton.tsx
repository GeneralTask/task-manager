import { TIconType } from '../../Icon'
import GTIconButton from '../../buttons/GTIconButton'

interface Props {
    icon: TIconType
    action: () => void
    isActive: boolean
}
const ToolbarButton = ({ icon, action, isActive }: Props) => {
    return (
        <GTIconButton
            onMouseDown={(e) => e.preventDefault()}
            icon={icon}
            iconColor="gray"
            onClick={() => action()}
            forceShowHoverEffect={isActive}
        />
    )
}

export default ToolbarButton

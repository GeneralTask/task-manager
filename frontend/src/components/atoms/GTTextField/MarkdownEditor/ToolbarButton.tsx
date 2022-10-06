import { TIconType } from '../../Icon'
import GTIconButton from '../../buttons/GTIconButton'

interface Props {
    icon: TIconType
    action: () => void
    isActive: boolean
    title: string
}
const ToolbarButton = ({ icon, action, isActive, title }: Props) => {
    return (
        <GTIconButton
            onMouseDown={(e) => e.preventDefault()}
            icon={icon}
            iconColor="gray"
            onClick={() => action()}
            forceShowHoverEffect={isActive}
            title={title}
        />
    )
}

export default ToolbarButton

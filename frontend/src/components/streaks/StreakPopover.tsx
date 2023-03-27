import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import GTPopover from '../radix/GTPopover'

const StreakPopover = () => {
    return (
        <GTPopover
            content={<div>ooo wee</div>}
            align="start"
            trigger={<GTButton styleType="icon" icon={icons.fire} />}
        />
    )
}

export default StreakPopover

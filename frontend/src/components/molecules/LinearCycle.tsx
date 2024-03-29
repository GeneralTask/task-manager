import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { TLinearCycle } from '../../utils/types'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import { BodySmall } from '../atoms/typography/Typography'

interface LinearCycleProps {
    cycle: TLinearCycle
    isCondensed?: boolean
}

const LinearCycle = ({ cycle, isCondensed }: LinearCycleProps) => {
    const getIcon = () => {
        if (cycle.is_current_cycle) return icons.linear_cycle_current
        if (cycle.is_next_cycle) return icons.linear_cycle_next
        if (cycle.is_previous_cycle) icons.linear_cycle_previous
        return icons.linear_cycle_all
    }
    return (
        <Flex alignItems="center" gap={Spacing._8}>
            <Icon icon={getIcon()} />
            <BodySmall color="muted">{isCondensed ? cycle.number : cycle.name ?? `Cycle ${cycle.number}`}</BodySmall>
        </Flex>
    )
}

export default LinearCycle

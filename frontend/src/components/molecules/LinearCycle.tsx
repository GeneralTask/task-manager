import { Spacing } from '../../styles'
import { TLinearCycle } from '../../utils/types'
import Flex from '../atoms/Flex'
import { Label } from '../atoms/typography/Typography'

interface LinearCycleProps {
    cycle: TLinearCycle
    isCondensed?: boolean
}

const LinearCycle = ({ cycle, isCondensed }: LinearCycleProps) => {
    return (
        <Flex alignItems="center" gap={Spacing._8}>
            <Label>{isCondensed ? cycle.number : cycle.name}</Label>
        </Flex>
    )
}

export default LinearCycle

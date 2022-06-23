import React from 'react'
import { icons } from '../../styles/images'
import { TOverviewBlock } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import { BlockHeader, BlockContainer, RemoveButton } from './styles'

interface OverviewBlockProps {
    block: TOverviewBlock
}
const OverviewBlock = ({ block }: OverviewBlockProps) => {
    return (
        <BlockContainer>
            <BlockHeader>
                {block.name}
                <RemoveButton>
                    <Icon source={icons.x_thin} size="xSmall" />
                </RemoveButton>
            </BlockHeader>
        </BlockContainer>
    )
}

export default OverviewBlock

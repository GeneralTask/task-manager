import React, { useMemo } from 'react'
import { icons } from '../../styles/images'
import { TOverviewBlock } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import TaskSectionBlockItems from './blockItems/TaskSectionBlockItems'
import { BlockHeader, BlockContainer, RemoveButton } from './styles'

interface OverviewBlockProps {
    block: TOverviewBlock
}
const OverviewBlock = ({ block }: OverviewBlockProps) => {
    const blockItems = useMemo(() => {
        switch (block.type) {
            case 'task_section':
                return <TaskSectionBlockItems block={block} />
            default:
                return <div>[WIP]List of items for type {block.type}</div>
        }
    }, [block])

    return (
        <BlockContainer>
            <BlockHeader>
                {block.name}
                <RemoveButton>
                    <Icon source={icons.x_thin} size="xSmall" />
                </RemoveButton>
            </BlockHeader>
            {blockItems}
        </BlockContainer>
    )
}

export default OverviewBlock

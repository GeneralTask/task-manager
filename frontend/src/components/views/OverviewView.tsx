import React from 'react'
import { Colors } from '../../styles'
import { TOverviewBlock } from '../../utils/types'
import OverviewBlock from '../overview/OverviewBlock'
import { DetailsViewContainer, OverviewPageContainer, PageHeader } from '../overview/styles'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const dummyData: TOverviewBlock[] = [
    {
        id: '1',
        name: 'My tasks',
        type: 'task_section',
        section_id: 'section 1',
        is_paginated: false,
        is_reorderable: true,
        view_items: [],
    },
    {
        id: '2',
        name: 'Your tasks',
        type: 'task_section',
        section_id: 'section 2',
        is_paginated: false,
        is_reorderable: true,
        view_items: [],
    },
    {
        id: '3',
        name: 'Backlog',
        type: 'task_section',
        section_id: 'section 3',
        is_paginated: false,
        is_reorderable: false,
        view_items: [],
    },
]

const OverviewView = () => {
    const blocks = dummyData
    return (
        <>
            <OverviewPageContainer>
                <PageHeader>Overview</PageHeader>
                <ScrollableListTemplate backgroundColor={Colors.gray._50}>
                    {blocks.map((block) => (
                        <OverviewBlock block={block} key={block.id} />
                    ))}
                </ScrollableListTemplate>
            </OverviewPageContainer>
            <DetailsViewContainer>These be the deets</DetailsViewContainer>
        </>
    )
}

export default OverviewView

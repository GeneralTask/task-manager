import React from 'react'
import styled from 'styled-components'
import { Spacing, Colors, Typography } from '../../styles'
import { TOverviewBlock } from '../../utils/types'
import OverviewBlock from '../overview/OverviewBlock'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const OverviewPageContainer = styled.div`
    flex: 1;
`
const PageHeader = styled.div`
    padding: ${Spacing.padding._16};
    color: ${Colors.gray._500};
    font-size: ${Typography.small.fontSize};
    border-bottom: 2px solid ${Colors.gray._200};
`
// placeholder for details view
const DetailsViewContainer = styled.div`
    background-color: ${Colors.white};
    padding-top: 50vh;
    min-width: 400px;
`

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
                <ScrollableListTemplate>
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

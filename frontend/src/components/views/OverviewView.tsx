import React from 'react'
import { useParams } from 'react-router-dom'
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
        view_items: [
            {
                id: '1',
                id_ordering: 1,
                title: 'Check in with Scott',
                body: 'pls',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
            {
                id: '2',
                id_ordering: 2,
                title: 'Check in with Nolan',
                body: 'pls',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
            {
                id: '3',
                id_ordering: 3,
                title: 'Buy more Waterloo',
                body: 'black cherry only >:o',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
        ],
    },
    {
        id: '2',
        name: 'Your tasks',
        type: 'task_section',
        section_id: 'section 2',
        is_paginated: false,
        is_reorderable: true,
        view_items: [
            {
                id: '1',
                id_ordering: 1,
                title: 'Check in with Scott',
                body: 'pls',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
            {
                id: '2',
                id_ordering: 2,
                title: 'Check in with Nolan',
                body: 'pls',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
            {
                id: '3',
                id_ordering: 3,
                title: 'Buy more Waterloo',
                body: 'black cherry only >:o',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
        ],
    },
    {
        id: '3',
        name: 'Backlog',
        type: 'task_section',
        section_id: 'section 3',
        is_paginated: false,
        is_reorderable: false,
        view_items: [
            {
                id: '1',
                id_ordering: 1,
                title: 'Check in with Scott',
                body: 'pls',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
            {
                id: '2',
                id_ordering: 2,
                title: 'Check in with Nolan',
                body: 'pls',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
            {
                id: '3',
                id_ordering: 3,
                title: 'Buy more Waterloo',
                body: 'black cherry only >:o',
                deeplink: '',
                sent_at: '',
                time_allocated: 0,
                due_date: '',
                source: {
                    name: 'General Task',
                    logo: '',
                    logo_v2: 'generaltask',
                    is_completable: false,
                    is_replyable: false,
                },
                sender: '',
                is_done: false,
                recipients: { to: [], cc: [], bcc: [] },
            },
        ],
    },
]

const OverviewView = () => {
    const blocks = dummyData
    const { overviewItem } = useParams()
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
            <DetailsViewContainer>
                These be the deets
                {overviewItem && ' for item with id: ' + overviewItem}
            </DetailsViewContainer>
        </>
    )
}

export default OverviewView

import React from 'react'
import { SectionHeader } from '../molecules/Header'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const OverviewView = () => {
    return (
        <ScrollableListTemplate>
            <SectionHeader sectionName="Overview" allowRefresh={false} />
            <div>This is the Overview Page</div>
        </ScrollableListTemplate>
    )
}

export default OverviewView

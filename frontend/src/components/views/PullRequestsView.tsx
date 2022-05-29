import React from 'react'
import ScrollView from '../atoms/ScrollView'
import { SectionHeader } from '../molecules/Header'

const PullRequestsView = () => {
    return (
        <ScrollView>
            <SectionHeader sectionName="Pull Requests" allowRefresh={false} />
        </ScrollView>
    )
}

export default PullRequestsView

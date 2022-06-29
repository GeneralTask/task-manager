import React from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Spacing, Colors, Typography } from '../../styles'
import useGeTOverviewViews from '../overview/dummydata'
import OverviewViewContainer from '../overview/OverviewViewContainer'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const PageHeader = styled.div`
    padding: ${Spacing.padding._16};
    color: ${Colors.gray._500};
    font-size: ${Typography.small.fontSize};
    border-bottom: 2px solid ${Colors.gray._200};
    margin-bottom: ${Spacing.margin._40};
`
// placeholder for details view
const DetailsViewContainer = styled.div`
    background-color: ${Colors.white};
    padding-top: 50vh;
    min-width: 400px;
`

const OverviewView = () => {
    const { data: views } = useGeTOverviewViews()
    const { overviewItem } = useParams()
    return (
        <>
            <ScrollableListTemplate noTopPadding>
                <PageHeader>Overview</PageHeader>
                {views.map((view) => (
                    <OverviewViewContainer view={view} key={view.id} />
                ))}
            </ScrollableListTemplate>
            <DetailsViewContainer>
                These be the deets
                {overviewItem && ' for item with id: ' + overviewItem}
            </DetailsViewContainer>
        </>
    )
}

export default OverviewView

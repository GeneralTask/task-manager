import React from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { useGetOverviewViews } from '../../services/api/overview.hooks'
import { Spacing, Colors, Typography } from '../../styles'
import EditViewsButton from '../overview/EditViewsButton'
import OverviewViewContainer from '../overview/OverviewViewContainer'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const PageHeader = styled.div`
    padding: ${Spacing.padding._16};
    color: ${Colors.gray._500};
    font-size: ${Typography.small.fontSize};
    border-bottom: 2px solid ${Colors.gray._200};
`
const ActionsContainer = styled.div`
    display: flex;
    justify-content: flex-end;
`
// placeholder for details view
const DetailsViewContainer = styled.div`
    background-color: ${Colors.white};
    flex: 1;
    display: flex;
    flex-direction: column;
    padding-top: 50vh;
    min-width: 300px;
`

const OverviewView = () => {
    const { data: views } = useGetOverviewViews()
    const { overviewItem } = useParams()
    return (
        <>
            <ScrollableListTemplate noTopPadding>
                <PageHeader>Overview</PageHeader>
                <ActionsContainer>
                    <EditViewsButton />
                </ActionsContainer>
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

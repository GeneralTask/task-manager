import React, { Fragment } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Spacing } from '../../../styles'
import { TOverviewView, TPullRequest } from '../../../utils/types'
import { Divider } from '../../atoms/SectionDivider'
import PullRequest from '../../pull-requests/PullRequest'

const DividerMargin = styled.div`
    margin: 0 ${Spacing.margin._16};
`

interface PullRequestViewItemsProps {
    view: TOverviewView
}
const PullRequestViewItems = ({ view }: PullRequestViewItemsProps) => {
    const { overviewViewId, overviewItemId } = useParams()

    return (
        <>
            {view.view_items.map((item, index) => (
                <Fragment key={item.id}>
                    <PullRequest
                        pullRequest={item as TPullRequest}
                        isSelected={overviewViewId === view.id && overviewItemId === item.id}
                        link={`/overview/${view.id}/${item.id}`}
                    />
                    {index !== view.view_items.length - 1 && (
                        <DividerMargin>
                            <Divider />
                        </DividerMargin>
                    )}
                </Fragment>
            ))}
        </>
    )
}

export default PullRequestViewItems

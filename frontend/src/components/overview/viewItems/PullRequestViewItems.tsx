import React, { Fragment } from 'react'
import { useParams } from 'react-router-dom'
import { TOverviewView, TPullRequest } from '../../../utils/types'
import PullRequest from '../../pull-requests/PullRequest'
import { DividerMargin } from '../styles'
interface PullRequestViewItemsProps {
    view: TOverviewView
}
const PullRequestViewItems = ({ view }: PullRequestViewItemsProps) => {
    const { overviewItem } = useParams()

    return (
        <div>
            {view.view_items.map((item, index) => (
                <Fragment key={item.id}>
                    <PullRequest
                        pullRequest={item as TPullRequest}
                        isSelected={overviewItem === item.id}
                        link={`/overview/${item.id}`}
                    />
                    {index !== view.view_items.length - 1 && <DividerMargin />}
                </Fragment>
            ))}
        </div>
    )
}

export default PullRequestViewItems

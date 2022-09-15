import { Fragment } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Spacing } from '../../../styles'
import { TPullRequest } from '../../../utils/types'
import { Divider } from '../../atoms/SectionDivider'
import PullRequest from '../../pull-requests/PullRequest'
import EmptyViewItem from './EmptyViewItem'
import { ViewItemsProps } from './viewItems.types'

const DividerMargin = styled.div`
    margin: 0 ${Spacing._16};
`

const PullRequestViewItems = ({ view, visibleItemsCount }: ViewItemsProps) => {
    const { overviewViewId, overviewItemId } = useParams()

    if (view.view_items.length === 0) {
        return (
            <EmptyViewItem
                header="You have no more pull requests!"
                body="When new pull requests get assigned to you, they will appear here."
            />
        )
    }

    return (
        <>
            {view.view_items.slice(0, visibleItemsCount).map((item, index) => (
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

import React, { Fragment, useRef } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'
import { Spacing } from '../../../styles'
import { TEmailThread, TOverviewView } from '../../../utils/types'
import { Divider } from '../../atoms/SectionDivider'
import ThreadTemplate from '../../atoms/ThreadTemplate'
import Thread from '../../molecules/Thread'

const DividerMargin = styled.div`
    margin: 0 ${Spacing.margin._16};
`

interface ExternalViewItemsProps {
    view: TOverviewView
}
const ExternalViewItems = ({ view }: ExternalViewItemsProps) => {
    const { overviewItem } = useParams()

    // TODO: either change Task to make this optional or add better support for scrolling. Unused for now.
    const scrollingRef = useRef<HTMLDivElement>(null)

    return (
        <div ref={scrollingRef}>
            {view.view_items.map((item, index) => (
                <Fragment key={item.id}>
                    <ThreadTemplate>
                        <Thread
                            thread={item as TEmailThread}
                            sectionScrollingRef={scrollingRef}
                            isSelected={overviewItem === item.id}
                            link={`/overview/${item.id}`}
                        />
                    </ThreadTemplate>
                    {index !== view.view_items.length - 1 && (
                        <DividerMargin>
                            <Divider />
                        </DividerMargin>
                    )}
                </Fragment>
            ))}
        </div>
    )
}

export default ExternalViewItems

import React, { Fragment, useRef } from 'react'
import styled from 'styled-components'
import { Spacing } from '../../../styles'
// import { useParams } from 'react-router-dom'
import { TEmailThread, TOverviewView } from '../../../utils/types'
import { Divider } from '../../atoms/SectionDivider'
import Thread from '../../molecules/Thread'

const DividerMargin = styled.div`
    margin: ${Spacing.margin._8} 0;
`

interface ExternalViewItemsProps {
    view: TOverviewView
}
const ExternalViewItems = ({ view }: ExternalViewItemsProps) => {
    // const { overviewItem } = useParams()

    // TODO: either change Task to make this optional or add better support for scrolling. Unused for now.
    const scrollingRef = useRef<HTMLDivElement>(null)

    return (
        <div ref={scrollingRef}>
            {view.view_items.map((item) => (
                <Fragment key={item.id}>
                    <Thread
                        thread={item as TEmailThread}
                        sectionScrollingRef={scrollingRef}
                        // isSelected={overviewItem === item.id}
                        // link={`/overview/${item.id}`}
                    />
                    <DividerMargin>
                        <Divider />
                    </DividerMargin>
                </Fragment>
            ))}
        </div>
    )
}

export default ExternalViewItems

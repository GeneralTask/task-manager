import { useCallback, useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import styled from 'styled-components'
import { Spacing } from '../../styles'
import { SectionHeader } from '../molecules/Header'
import useOverviewLists from '../overview/useOverviewLists'
import OverviewAccordionItem from '../radix/OverviewAccordionItem'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const AccordionRoot = styled(Accordion.Root)`
    > * > h3 {
        all: unset;
    }
    > div {
        margin-bottom: ${Spacing._4};
    }
`

const DailyOverviewView = () => {
    const { lists } = useOverviewLists()
    const [values, setValues] = useState<string[]>([])

    const collapseAll = () => setValues([])
    const expandAll = useCallback(() => setValues(lists.map((list) => list.id)), [lists])
    return (
        <ScrollableListTemplate>
            <SectionHeader sectionName="Daily Overview" />
            <button onClick={collapseAll}>collapse all</button>
            <button onClick={expandAll}>expand all</button>
            <AccordionRoot type="multiple" value={values} onValueChange={setValues}>
                {lists.map((list) => (
                    <OverviewAccordionItem key={list.id} list={list} />
                ))}
            </AccordionRoot>
        </ScrollableListTemplate>
    )
}

export default DailyOverviewView

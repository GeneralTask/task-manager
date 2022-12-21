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
    return (
        <ScrollableListTemplate>
            <SectionHeader sectionName="Daily Overview" />
            <AccordionRoot type="multiple">
                {lists.map((list) => (
                    <OverviewAccordionItem key={list.id} list={list} />
                ))}
            </AccordionRoot>
        </ScrollableListTemplate>
    )
}

export default DailyOverviewView

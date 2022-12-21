import { useCallback, useState } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import styled from 'styled-components'
import { Border, Colors, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import GTButton from '../atoms/buttons/GTButton'
import { SectionHeader } from '../molecules/Header'
import useOverviewLists from '../overview/useOverviewLists'
import OverviewAccordionItem from '../radix/OverviewAccordionItem'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const ActionsContainer = styled.div`
    background-color: ${Colors.background.medium};
    padding: ${Spacing._8} ${Spacing._12};
    border-radius: ${Border.radius.mini};
    display: flex;
    gap: ${Spacing._24};
    margin-bottom: ${Spacing._16};
`
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
            <ActionsContainer>
                <GTButton
                    styleType="simple"
                    size="small"
                    onClick={collapseAll}
                    icon={icons.squareMinus}
                    iconColor="gray"
                    value="Collapse All"
                />
                <GTButton
                    styleType="simple"
                    size="small"
                    onClick={expandAll}
                    icon={icons.squarePlus}
                    iconColor="gray"
                    value="Expand All"
                />
            </ActionsContainer>
            <AccordionRoot type="multiple" value={values} onValueChange={setValues}>
                {lists.map((list) => (
                    <OverviewAccordionItem key={list.id} list={list} />
                ))}
            </AccordionRoot>
        </ScrollableListTemplate>
    )
}

export default DailyOverviewView

import * as Accordion from '@radix-ui/react-accordion'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { icons, logos } from '../../styles/images'
import { TOverviewView } from '../../utils/types'
import { Icon } from '../atoms/Icon'
import { Body, Label } from '../atoms/typography/Typography'
import { MenuTriggerShared } from './RadixUIConstants'

const AccordionTrigger = styled(Accordion.Trigger)`
    ${MenuTriggerShared};
    outline: none !important;
    user-select: none;
    width: 100%;
    box-sizing: border-box;
    background-color: ${Colors.background.white};
    padding: ${Spacing._16};
    display: flex;
    justify-content: space-between;
    border-radius: ${Border.radius.small};
    &[data-state='open'] {
        border-radius: ${Border.radius.small} ${Border.radius.small} 0 0;
    }
    cursor: pointer;
    &[data-state='open'] > div > .AccordionChevron {
        transform: rotate(180deg);
    }
    box-shadow: ${Shadows.button.default};
`
const TriggerTitle = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._16};
`
const TriggerRightContainer = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._16};
`
const ListContent = styled.div`
    padding: ${Spacing._16};
    background-color: ${Colors.background.white};
    border-radius: 0 0 ${Border.radius.small} ${Border.radius.small};
    box-shadow: ${Shadows.button.default};
`
interface OverviewAccordionItemProps {
    list: TOverviewView
}
const OverviewAccordionItem = ({ list }: OverviewAccordionItemProps) => {
    return (
        <Accordion.Item value={list.id} key={list.id}>
            <Accordion.Header>
                <AccordionTrigger>
                    <TriggerTitle>
                        <Icon icon={logos[list.logo]} />
                        <Body>{list.name}</Body>
                    </TriggerTitle>
                    <TriggerRightContainer>
                        {list.view_items.length > 0 && <Label>{list.view_items.length} remaining</Label>}
                        <Icon icon={icons.caret_down} className="AccordionChevron" />
                    </TriggerRightContainer>
                </AccordionTrigger>
            </Accordion.Header>
            <Accordion.Content>
                <ListContent>i am the content</ListContent>
            </Accordion.Content>
        </Accordion.Item>
    )
}

export default OverviewAccordionItem

import * as Accordion from '@radix-ui/react-accordion'
import styled, { keyframes } from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { icons, logos } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { Body, Label } from '../atoms/typography/Typography'
import { SectionHeader } from '../molecules/Header'
import useOverviewLists from '../overview/useOverviewLists'
import { MenuTriggerShared } from '../radix/RadixUIConstants'
import ScrollableListTemplate from '../templates/ScrollableListTemplate'

const slideDown = keyframes`


    from {
      height: 0;
    }
    to {
      height: var(--radix-accordion-content-height);
    }

  
`
const slideUp = keyframes`
from {
    height: var(--radix-accordion-content-height);
  }
  to {
    height: 0;
  }
`
const AccordionRoot = styled(Accordion.Root)`
    > * > h3 {
        all: unset;
    }
    > div {
    }
`
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
const AccordionItem = styled(Accordion.Item)`
    overflow: hidden;
    padding: 4px;
`

const AccordionContent = styled(Accordion.Content)`
    &[data-state='open'] {
        animation: ${slideDown} 300ms cubic-bezier(0.87, 0, 0.13, 1);
    }
    &[data-state='closed'] {
        animation: ${slideUp} 300ms cubic-bezier(0.87, 0, 0.13, 1);
      }
ke      
`
const ListContent = styled.div`
    padding: ${Spacing._16};
    background-color: ${Colors.background.white};
    border-radius: 0 0 ${Border.radius.small} ${Border.radius.small};
    box-shadow: ${Shadows.button.default};
`

const DailyOverviewView = () => {
    const { lists } = useOverviewLists()

    return (
        <ScrollableListTemplate>
            <SectionHeader sectionName="Daily Overview" />
            <AccordionRoot type="multiple">
                {lists.map((list) => (
                    <AccordionItem value={list.id} key={list.id}>
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
                        <AccordionContent>
                            <ListContent>i am the content</ListContent>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </AccordionRoot>
        </ScrollableListTemplate>
    )
}

export default DailyOverviewView

import { useLayoutEffect } from 'react'
import styled from 'styled-components'
import { DEFAULT_FOLDER_ID } from '../../constants'
import useOverviewContext from '../../context/OverviewContextProvider'
import useGetViewItems from '../../hooks/useGetViewItems'
import useGetVisibleItemCount, { PAGE_SIZE } from '../../hooks/useGetVisibleItemCount'
import { Border, Colors, Shadows, Spacing } from '../../styles'
import { TLogoImage, icons, logos } from '../../styles/images'
import { TOverviewView } from '../../utils/types'
import GTAccordionHeader from './AccordionHeader'
import AuthBanner from './AuthBanner'
import { PaginateTextButton } from './styles'

const AccordionContainer = styled.div`
    margin-bottom: ${Spacing._8};
`
const Trigger = styled.div<{ isOpen: boolean }>`
    outline: none !important;
    user-select: none;
    width: 100%;
    box-sizing: border-box;
    background-color: ${Colors.background.white};
    padding: ${Spacing._16};
    display: flex;
    justify-content: space-between;
    border-radius: ${Border.radius.medium};
    ${(props) => props.isOpen && `border-radius: ${Border.radius.medium} ${Border.radius.medium} 0 0;`}
    cursor: pointer;
    box-shadow: ${Shadows.deprecated_button.default};
`

const ListContent = styled.div`
    padding: ${Spacing._16};
    background-color: ${Colors.background.white};
    border-radius: 0 0 ${Border.radius.medium} ${Border.radius.medium};
    box-shadow: ${Shadows.deprecated_button.default};
`

export const getOverviewAccordionHeaderIcon = (logo: TLogoImage, sectionId?: string) => {
    if (logo !== 'generaltask') return logos[logo]
    return sectionId === DEFAULT_FOLDER_ID ? icons.inbox : icons.folder
}

interface AccordionItemProps {
    list: TOverviewView
}
const AccordionItem = ({ list }: AccordionItemProps) => {
    const ViewItems = useGetViewItems(list)
    const { setOpenListIds, openListIds } = useOverviewContext()
    const isOpen = openListIds.includes(list.id)

    const toggerAccordion = () => {
        if (isOpen) setOpenListIds(openListIds.filter((id) => id !== list.id))
        else setOpenListIds([...openListIds, list.id])
    }

    useLayoutEffect(() => {
        //close if no view items
        if (list.view_item_ids.length === 0) setOpenListIds(openListIds.filter((id) => id !== list.id))
    }, [list.view_item_ids.length])

    const [visibleItemsCount, setVisibleItemsCount] = useGetVisibleItemCount(list, list.id)

    const nextPageLength = Math.min(list.view_items.length - visibleItemsCount, PAGE_SIZE)

    return (
        <AccordionContainer>
            <Trigger onClick={toggerAccordion} isOpen={isOpen}>
                <GTAccordionHeader list={list} isOpen={isOpen} />
            </Trigger>
            {isOpen && (
                <ListContent>
                    {list.is_linked ? (
                        <>
                            <ViewItems view={list} visibleItemsCount={visibleItemsCount} hideHeader />
                            {visibleItemsCount < list.view_items.length && (
                                <PaginateTextButton
                                    onClick={() => setVisibleItemsCount(visibleItemsCount + nextPageLength)}
                                >
                                    View more ({nextPageLength})
                                </PaginateTextButton>
                            )}
                        </>
                    ) : (
                        list.sources.map((source) => (
                            <AuthBanner
                                key={source.name}
                                authorizationUrl={source.authorization_url}
                                name={source.name}
                                logo={list.logo}
                                hasBorder={true}
                            />
                        ))
                    )}
                </ListContent>
            )}
        </AccordionContainer>
    )
}

export default AccordionItem

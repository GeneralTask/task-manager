import React from 'react'
import styled from 'styled-components'
import { NavbarPage } from '../../helpers/enums'
import { TEXT_GRAY } from '../../helpers/styles'
import { useAppSelector } from '../../redux/hooks'

const ItemCountContainer = styled.span`
    font-family: Switzer-Variable;
    font-style: normal;
    font-size: 15px;
    line-height: 16px;
    flex-grow: 1;
    text-align: right;
    padding-right: 10px;
    color: ${TEXT_GRAY};
`

interface ItemCountProps {
    page: NavbarPage
}
const ItemCount = ({ page }: ItemCountProps): JSX.Element => {
    const { taskSections, messages } = useAppSelector((state) => ({
        taskSections: state.tasks_page.tasks.task_sections,
        messages: state.messages_page.messages,
    }))
    if (page === NavbarPage.MESSAGES_PAGE) {
        return <ItemCountContainer>{messages?.messages_array?.length || null}</ItemCountContainer>
    }
    const currentSection = taskSections.find((section) => page.startsWith(section.name.toLowerCase()))
    return <ItemCountContainer>{currentSection?.tasks?.length || null}</ItemCountContainer>
}
export default ItemCount

import { Colors, Dimensions, Shadows, Spacing } from '../../styles'
import React, { ReactChild, useRef } from 'react'

import { radius } from '../../styles/border'
import styled from 'styled-components'
import { useClickOutside } from '../../hooks'

const LabelEditorContainer = styled.div`
    display: flex;
    flex-direction: column;
    width: ${Dimensions.TASK_ACTION_WIDTH};
    position: absolute;
    background-color: ${Colors.white};
    border-radius: ${radius.regular};
    box-shadow: ${Shadows.medium};
    z-index: 1;
    top: 100%;
    right: 0;
    cursor: default;
    outline: none;
`
const OptionsContainer = styled.div`
    overflow: auto;
    max-height: 500px;
`
const TopNav = styled.div`
    padding: ${Spacing.padding._12}px ${Spacing.padding._16}px;
    border-bottom: 1px solid ${Colors.gray._100};
`
const Header = styled.div`
    color: ${Colors.gray._600};
`
const ListItem = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${Spacing.padding._12}px ${Spacing.padding._16}px;
    border-bottom: 1px solid ${Colors.gray._100};
    &:hover {
        background-color: ${Colors.gray._100};
    }
    cursor: pointer;
`
const SectionTitleBox = styled.div`
    display: flex;
    flex: 1;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing.padding._8}px;
    color: ${Colors.gray._600};
    min-width: 0;
`
const PositionRelative = styled.div`
    position: relative;
`

interface Option {
    item: ReactChild
    onClick: () => void
}

interface GTSelectProps {
    options: Option[]
    onClose: () => void
    title?: ReactChild
    parentRef?: React.RefObject<HTMLElement> // pass this in to exclude parent from click outside
}
const GTSelect = ({ options, onClose, title, parentRef }: GTSelectProps) => {
    const selectRef = useRef(null)
    useClickOutside(selectRef, onClose)
    const optionsList = options.map((option, index) => (
        <ListItem
            key={index}
            tabIndex={0}
            onClick={() => {
                option.onClick()
                onClose()
            }}
        >
            <SectionTitleBox>{option.item}</SectionTitleBox>
        </ListItem>
    ))
    return (
        <PositionRelative>
            <LabelEditorContainer ref={selectRef} onClick={(e) => e.stopPropagation()}>
                {title && (
                    <TopNav>
                        <Header>{title}</Header>
                    </TopNav>
                )}
                <OptionsContainer>{optionsList}</OptionsContainer>
            </LabelEditorContainer>
        </PositionRelative>
    )
}

export default GTSelect

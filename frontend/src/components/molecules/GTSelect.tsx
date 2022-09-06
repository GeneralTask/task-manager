import { Border, Colors, Shadows, Spacing } from '../../styles'
import React, { ReactNode, useRef } from 'react'
import styled from 'styled-components'
import { useClickOutside } from '../../hooks'

const SelectContainer = styled.div<{ alignment: 'left' | 'right' }>`
    display: flex;
    flex-direction: column;
    position: absolute;
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.medium};
    box-shadow: ${Shadows.medium};
    z-index: 1;
    ${({ alignment }) => alignment === 'left' && 'right: 0;'}
    cursor: default;
    outline: none;
`
const OptionsContainer = styled.div`
    overflow: hidden;
    border-radius: inherit;
    max-height: 500px;
`
const TitleContainer = styled.div`
    padding: ${Spacing.small} ${Spacing.regular};
    border-bottom: 1px solid ${Colors.background.medium};
    color: ${Colors.text.light};
`
const ListItem = styled.div<{ hasPadding: boolean }>`
    display: flex;
    justify-content: space-between;
    align-items: center;
    ${({ hasPadding }) => (hasPadding ? `padding: ${Spacing.extraSmall} ${Spacing.regular};` : '')}
    &:hover {
        background-color: ${Colors.background.medium};
    }
    overflow: hidden;
    cursor: pointer;
`
const SectionTitleBox = styled.div`
    display: flex;
    flex: 1;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing.extraSmall};
    color: ${Colors.text.light};
    min-width: 0;
`
const PositionRelative = styled.div`
    position: relative;
`

interface GTSelectOption {
    item: ReactNode
    onClick: () => void
    hasPadding?: boolean // default to true
}

interface GTSelectProps {
    options: GTSelectOption[]
    onClose: () => void
    location?: 'left' | 'right'
    title?: ReactNode
    parentRef?: React.RefObject<HTMLElement> // pass this in to exclude parent from click outside
}
const GTSelect = ({ options, onClose, location, title, parentRef }: GTSelectProps) => {
    location = location ?? 'right'
    const selectRef = useRef(null)
    useClickOutside(parentRef ?? selectRef, onClose)
    const optionsList = options.map((option, index) => (
        <ListItem
            key={index}
            tabIndex={0}
            onClick={() => {
                option.onClick()
                onClose()
            }}
            hasPadding={option.hasPadding !== false}
        >
            <SectionTitleBox>{option.item}</SectionTitleBox>
        </ListItem>
    ))
    return (
        <PositionRelative>
            <SelectContainer ref={selectRef} onClick={(e) => e.stopPropagation()} alignment={location}>
                {title && <TitleContainer>{title}</TitleContainer>}
                <OptionsContainer>{optionsList}</OptionsContainer>
            </SelectContainer>
        </PositionRelative>
    )
}

export default React.memo(GTSelect)

import { ICON_HOVER } from '../../helpers/styles'
import React from 'react'
import styled from 'styled-components'
import { useKeyboardShortcut } from './KeyboardShortcut'

export const HoverButton = styled.button`
    background-color: transparent;
    cursor: pointer;
    height: fit-content;
    width: fit-content;
    border: none;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    &:hover {
        background: ${ICON_HOVER};
    }
`
export const Icon = styled.img<{ facingLeft: boolean }>`
    height: 28px;
    width: 28px;
    transform: ${(props) => (props.facingLeft ? 'scaleX(-1)' : 'none')};
`

interface Props {
    direction: 'left' | 'right'
    onClick: () => void
}
export default function ExpandCollapse({ direction, onClick }: Props): JSX.Element {
    useKeyboardShortcut('c', onClick)
    return (
        <HoverButton onClick={onClick}>
            <Icon
                facingLeft={direction === 'left'}
                src={`${process.env.PUBLIC_URL}/images/expand-collapse.svg`}
                alt="Show calendar"
            />
        </HoverButton>
    )
}

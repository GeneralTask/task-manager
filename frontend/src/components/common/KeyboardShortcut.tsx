import React from 'react'
import styled from 'styled-components'
import { BACKGROUND_WHITE, SHADOW_KEYBOARD_SHORTCUT, TEXT_GRAY } from '../../helpers/styles'

const KeyboardShortcutContainer = styled.div`
    height: 24px;
    width: 24px;
    display: flex;
    flex-shrink: 0;
    background: ${BACKGROUND_WHITE};
    box-shadow: ${SHADOW_KEYBOARD_SHORTCUT};
    margin-right: 12px;
    border-radius: 5px;

    font-family: Switzer-Variable;
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 16px;
    color: ${TEXT_GRAY};
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
`

interface KeyboardShortcutProps {
    shortcut: string
}
function KeyboardShortcut(props: KeyboardShortcutProps): JSX.Element {
    return (
        <KeyboardShortcutContainer>
            {props.shortcut}
        </KeyboardShortcutContainer>
    )
}

export default KeyboardShortcut

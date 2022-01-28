import React from 'react'
import styled from 'styled-components'

const KeyboardShortcutContainer = styled.div`
height: 24px;
width: 24px;
display: flex;
flex-shrink: 0;
background: rgba(255, 255, 255, 0.8);
box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06);
margin-right: 12px;
border-radius: 5px;

font-family: Space Grotesk;
font-style: normal;
font-weight: 500;
font-size: 12px;
line-height: 16px;
color: #A1A1AA;
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

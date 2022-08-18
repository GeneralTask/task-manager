import { useCallback, useEffect, useRef } from 'react'

import ActionValue from '../atoms/ActionValue'
import { Icon } from '../atoms/Icon'
import { KEYBOARD_SHORTCUTS, TKeyboardShortcuts } from '../../constants'
import LabelEditor from './LabelEditor'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import React from 'react'
import { Spacing } from '../../styles'
import { TTask } from '../../utils/types'
import { icons } from '../../styles/images'
import styled from 'styled-components'
import { useClickOutside } from '../../hooks'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import TooltipWrapper from '../atoms/TooltipWrapper'
import { KeyboardShortcutContainer } from '../atoms/KeyboardShortcut'
import * as ReactDOMServer from 'react-dom/server'

const ButtonAndPopoverContainer = styled.div`
    position: relative;
`
const ActionButton = styled(NoStyleButton)`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: ${Spacing.padding._4};
    margin-right: ${Spacing.margin._8};
    position: relative;
`

const TooltipContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
`

const LabelContainer = styled.div`
    margin-right: ${Spacing.margin._8};
`
interface ActionOptionProps {
    task: TTask
    isShown: boolean
    keyboardShortcut: TKeyboardShortcuts
    setIsShown: (isShown: boolean) => void
}

const label = ReactDOMServer.renderToString(
    <TooltipContainer>
        <LabelContainer>Label</LabelContainer>
        <KeyboardShortcutContainer isPressed={false}>{KEYBOARD_SHORTCUTS.showLabelEditor}</KeyboardShortcutContainer>
    </TooltipContainer>
)

const ActionOption = ({ task, isShown, keyboardShortcut, setIsShown }: ActionOptionProps) => {
    const actionRef = useRef<HTMLDivElement>(null)
    useClickOutside(actionRef, () => setIsShown(false))
    useEffect(() => {
        setIsShown(false)
    }, [task])

    // show action when keyboardShortcut is pressed
    useKeyboardShortcut(
        keyboardShortcut,
        useCallback(() => setIsShown(!isShown), [isShown])
    )
    useKeyboardShortcut(
        'close',
        useCallback(() => setIsShown(false), []),
        !isShown
    )

    const { icon, popover, actionString } = (() => {
        return {
            icon: icons.label,
            popover: <LabelEditor task_id={task.id} closeLabelEditor={() => setIsShown(false)} />,
            actionString: '',
        }
    })()

    return (
        <ButtonAndPopoverContainer ref={actionRef}>
            <ActionButton onClick={() => setIsShown(!isShown)}>
                <TooltipWrapper inline dataTip={label} tooltipId="tooltip">
                    {actionString ? <ActionValue value={actionString} /> : <Icon icon={icon} size="small" />}
                </TooltipWrapper>
            </ActionButton>
            {isShown && popover}
        </ButtonAndPopoverContainer>
    )
}

export default ActionOption

import { useCallback, useEffect, useRef } from 'react'

import { ActionValue } from '@atoms'
import { Icon } from '@atoms'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import LabelEditor from './LabelEditor'
import NoStyleButton from '../atoms/buttons/NoStyleButton'
import React from 'react'
import { Spacing } from '../../styles'
import { TTask } from '../../utils/types'
import { icons } from '../../styles/images'
import styled from 'styled-components'
import { useClickOutside } from '../../hooks'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import { TooltipWrapper } from '@atoms'

const ButtonAndPopoverContainer = styled.div`
    position: relative;
`
const ActionButton = styled(NoStyleButton)`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    padding: ${Spacing.padding._4}px;
    margin-right: ${Spacing.margin._8}px;
    position: relative;
`

interface ActionOptionProps {
    task: TTask
    isShown: boolean
    keyboardShortcut: KEYBOARD_SHORTCUTS
    setIsShown: (isShown: boolean) => void
}
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
    // when the action is shown, close action when KEYBOARD_SHORTCUTS.CLOSE is pressed
    useKeyboardShortcut(
        KEYBOARD_SHORTCUTS.CLOSE,
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
                <TooltipWrapper inline dataTip="Label" tooltipId="tooltip">
                    {actionString ? <ActionValue value={actionString} /> : <Icon source={icon} size="small" />}
                </TooltipWrapper>
            </ActionButton>
            {isShown && popover}
        </ButtonAndPopoverContainer>
    )
}

export default ActionOption

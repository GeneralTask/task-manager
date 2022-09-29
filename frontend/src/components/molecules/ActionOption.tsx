import { useCallback, useEffect, useRef } from 'react'
import * as ReactDOMServer from 'react-dom/server'
import styled from 'styled-components'
import KEYBOARD_SHORTCUTS, { TShortcutName } from '../../constants/shortcuts'
import { useClickOutside } from '../../hooks'
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut'
import { Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { TTask } from '../../utils/types'
import { KeyboardShortcutContainer } from '../atoms/KeyboardShortcut'
import TooltipWrapper from '../atoms/TooltipWrapper'
import GTIconButton from '../atoms/buttons/GTIconButton'
import SectionEditor from './SectionEditor'

const ButtonAndPopoverContainer = styled.div`
    position: relative;
`

const TooltipContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
`

const SectionContainer = styled.div`
    margin-right: ${Spacing._8};
`
interface ActionOptionProps {
    task: TTask
    isShown: boolean
    keyboardShortcut: TShortcutName
    setIsShown: (isShown: boolean) => void
}

const section = ReactDOMServer.renderToString(
    <TooltipContainer>
        <SectionContainer>{KEYBOARD_SHORTCUTS.showSectionEditor.label}</SectionContainer>
        <KeyboardShortcutContainer>{KEYBOARD_SHORTCUTS.showSectionEditor.keyLabel}</KeyboardShortcutContainer>
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

    const { icon, popover } = (() => {
        return {
            icon: icons.folder,
            popover: <SectionEditor task_id={task.id} closeSectionEditor={() => setIsShown(false)} />,
        }
    })()

    return (
        <ButtonAndPopoverContainer ref={actionRef}>
            <TooltipWrapper inline dataTip={section} tooltipId="tooltip">
                <GTIconButton icon={icon} onClick={() => setIsShown(!isShown)} />
            </TooltipWrapper>
            {isShown && popover}
        </ButtonAndPopoverContainer>
    )
}

export default ActionOption

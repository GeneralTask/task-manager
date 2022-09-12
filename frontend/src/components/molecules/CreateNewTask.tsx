import KEYBOARD_SHORTCUTS from '../../constants/shortcuts'
import { useKeyboardShortcut } from '../../hooks'
import { useCreateTask } from '../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography, Dimensions } from '../../styles'
import { icons } from '../../styles/images'
import { stopKeydownPropogation } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import { KeyboardShortcutContainer } from '../atoms/KeyboardShortcut'
import { useCallback, useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import styled from 'styled-components'

const CreateNewTaskContainer = styled.div`
    display: flex;
    flex-shrink: 0;
    flex-direction: row;
    gap: ${Spacing._8};
    background-color: ${Colors.background.medium};
    height: ${Dimensions.TASK_HEIGHT};
    align-items: center;
    padding: 0px ${Spacing._8};
    border-radius: ${Border.radius.medium};
    margin-bottom: ${Spacing._8};
`
const TaskInput = styled.input`
    border: none;
    outline: none;
    background-color: transparent;
    flex: 1;
    ${Typography.bodySmall};
`
const Tooltip = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    ${Typography.bodySmall};
`

const blurShortcuts = [KEYBOARD_SHORTCUTS.arrowUp.key, KEYBOARD_SHORTCUTS.arrowDown.key, KEYBOARD_SHORTCUTS.close.key]

interface CreateNewTaskProps {
    sectionId: string
    disableKeyboardShortcut?: boolean
}
const CreateNewTask = ({ sectionId, disableKeyboardShortcut }: CreateNewTaskProps) => {
    const [text, setText] = useState('')
    const { mutate: createTask } = useCreateTask()
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const submitNewTask = async () => {
        if (!text) return
        else {
            setText('')
            createTask({ title: text, taskSectionId: sectionId })
        }
    }
    const handleKeyDown = (e: React.KeyboardEvent) => {
        stopKeydownPropogation(e, blurShortcuts)
        if (blurShortcuts.includes(e.key)) {
            inputRef.current?.blur()
        }
        if (e.key === 'Enter') {
            submitNewTask()
        }
    }

    useEffect(() => {
        ReactTooltip.rebuild()
    }, [])

    const overrideTooltipPosition = useCallback(
        (
            position: { left: number; top: number },
            _currentEvent: Event,
            _currentTarget: EventTarget,
            refNode: null | HTMLDivElement | HTMLSpanElement
        ) => {
            const { left, top } = position
            if (containerRef.current && refNode) {
                const createNewTaskHalfWidth = containerRef.current.offsetWidth / 2
                const tooltipHalfWidth = refNode?.offsetWidth / 2
                return { left: left + createNewTaskHalfWidth - tooltipHalfWidth, top: top }
            }
            return { left: left, top: top }
        },
        [containerRef.current]
    )

    const toolTipContent = (
        <Tooltip>
            <span>{KEYBOARD_SHORTCUTS.createTask.label}</span>
            {!disableKeyboardShortcut && (
                <KeyboardShortcutContainer>{KEYBOARD_SHORTCUTS.createTask.keyLabel}</KeyboardShortcutContainer>
            )}
        </Tooltip>
    )

    useKeyboardShortcut(
        'createTask',
        // this is a shameful hack to wait for the command palette to close before focusing on the input
        useCallback(() => setTimeout(() => inputRef.current?.focus(), 10), []),
        disableKeyboardShortcut
    )

    return (
        <>
            <CreateNewTaskContainer data-tip data-for="createNewTaskTip" ref={containerRef}>
                <Icon icon={icons.plus} size={'small'} />
                <TaskInput
                    ref={inputRef}
                    value={text}
                    placeholder="Add new task"
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setText(e.target.value)}
                />
            </CreateNewTaskContainer>
            <ReactTooltip
                id="createNewTaskTip"
                place="top"
                type="light"
                effect="solid"
                className="tooltip"
                overridePosition={overrideTooltipPosition}
            >
                {toolTipContent}
            </ReactTooltip>
        </>
    )
}

export default CreateNewTask

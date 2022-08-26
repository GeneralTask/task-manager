import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import styled from 'styled-components'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import { useKeyboardShortcut } from '../../hooks'
import { useCreateTask } from '../../services/api/tasks.hooks'
import { Border, Colors, Spacing, Typography, Dimensions } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { KeyboardShortcutContainer } from '../atoms/KeyboardShortcut'

const CreateNewTaskContainer = styled.div`
    display: flex;
    flex-shrink: 0;
    flex-direction: row;
    gap: ${Spacing.padding._8};
    background-color: ${Colors.background.medium};
    height: ${Dimensions.TASK_HEIGHT};
    align-items: center;
    padding: 0px ${Spacing.padding._8};
    border-radius: ${Border.radius.medium};
    margin-bottom: ${Spacing.padding._8};
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
    gap: ${Spacing.padding._8};
    ${Typography.bodySmall};
`

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
        if (e.key === 'ArrowDown') inputRef.current?.blur()
        else e.stopPropagation()
        if (e.key === 'Enter') submitNewTask()
        else if (e.key === 'Escape') inputRef.current?.blur()
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
            <span>Create new task</span>
            {!disableKeyboardShortcut && (
                <KeyboardShortcutContainer>{KEYBOARD_SHORTCUTS.createTask}</KeyboardShortcutContainer>
            )}
        </Tooltip>
    )

    useKeyboardShortcut('createTask', () => inputRef.current?.focus(), disableKeyboardShortcut)

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

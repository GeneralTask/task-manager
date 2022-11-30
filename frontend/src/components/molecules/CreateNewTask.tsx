import { useCallback, useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import styled from 'styled-components'
import { v4 as uuidv4 } from 'uuid'
import KEYBOARD_SHORTCUTS from '../../constants/shortcuts'
import { useKeyboardShortcut } from '../../hooks'
import { useCreateTask } from '../../services/api/tasks.hooks'
import { Border, Colors, Dimensions, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { stopKeydownPropogation } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import { KeyboardShortcutContainer } from '../atoms/KeyboardShortcut'

const CreateNewTaskContainer = styled.div`
    display: flex;
    flex-shrink: 0;
    flex-direction: row;
    gap: ${Spacing._8};
    background-color: ${Colors.background.medium};
    height: ${Dimensions.TASK_HEIGHT};
    align-items: center;
    padding: 0px ${Spacing._8};
    border-radius: ${Border.radius.mini};
    box-sizing: border-box;
    border: ${Border.stroke.medium} solid transparent;
    :focus-within {
        border: ${Border.stroke.medium} solid ${Colors.border.purple};
    }
    margin-bottom: ${Spacing._8};
`
export const TaskInput = styled.input`
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

const blurShortcuts = [KEYBOARD_SHORTCUTS.close.key]

interface CreateNewTaskProps {
    sectionId: string
    disableTooltip?: boolean
}
const CreateNewTask = ({ sectionId, disableTooltip }: CreateNewTaskProps) => {
    const [text, setText] = useState('')
    const [shouldFocus, setShouldFocus] = useState(false)
    const { mutate: createTask } = useCreateTask()
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const submitNewTask = async () => {
        if (!text) return
        else {
            setText('')
            createTask({ title: text, taskSectionId: sectionId, optimisticId: uuidv4() })
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

    useEffect(() => {
        if (shouldFocus) {
            inputRef.current?.focus()
            setShouldFocus(false)
        }
    }, [shouldFocus])

    useKeyboardShortcut(
        'createTask',
        // this is a shameful hack to wait for the command palette to close before focusing on the input
        useCallback(() => setShouldFocus(true), []),
        disableTooltip
    )

    return (
        <>
            <CreateNewTaskContainer data-tip data-for="createNewTaskTip" ref={containerRef}>
                <Icon icon={icons.plus} />
                <TaskInput
                    ref={inputRef}
                    value={text}
                    placeholder="Add new task"
                    onKeyDown={handleKeyDown}
                    onChange={(e) => setText(e.target.value)}
                />
            </CreateNewTaskContainer>
            {!disableTooltip && (
                <ReactTooltip
                    id="createNewTaskTip"
                    place="top"
                    type="light"
                    effect="solid"
                    delayShow={500}
                    className="tooltip"
                    overridePosition={overrideTooltipPosition}
                >
                    <Tooltip>
                        <span>Add new task</span>
                        <KeyboardShortcutContainer>{KEYBOARD_SHORTCUTS.createTask.keyLabel}</KeyboardShortcutContainer>
                    </Tooltip>
                </ReactTooltip>
            )}
        </>
    )
}

export default CreateNewTask

import { useCallback, useEffect, useRef, useState } from 'react'
import ReactTooltip from 'react-tooltip'
import styled from 'styled-components'
import { KEYBOARD_SHORTCUTS } from '../../constants'
import { useKeyboardShortcut } from '../../hooks'
import { useCreateTask } from '../../services/api/tasks.hooks'
import { Border, Colors, Dimensions, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import GTInput from '../atoms/GTInput'
import { Icon } from '../atoms/Icon'
import { KeyboardShortcutContainer } from '../atoms/KeyboardShortcut'

const CreateNewTaskContainer = styled.div`
    display: flex;
    min-height: ${Dimensions.TASK_HEIGHT};
    margin-bottom: ${Spacing._8};
    background-color: ${Colors.background.medium};
    border-radius: ${Border.radius.small};
`
const CreateNewTaskInput = styled(GTInput)`
    flex: 1;
`
const InputMimicContainer = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    padding: ${Spacing._8};
    cursor: pointer;
    color: ${Colors.text.light};
    ${Typography.bodySmall};
`
const Tooltip = styled.div`
    display: flex;
    align-items: center;
    gap: ${Spacing._8};
    ${Typography.bodySmall};
`

interface CreateNewTaskProps {
    sectionId: string
    disableTooltip?: boolean
}
const CreateNewTask = ({ sectionId, disableTooltip }: CreateNewTaskProps) => {
    const [text, setText] = useState('')
    const [isFocused, setIsFocused] = useState(false)
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

    useKeyboardShortcut(
        'createTask',
        () => {
            setIsFocused(true)
            inputRef.current?.focus()
        },
        disableTooltip
    )

    return (
        <>
            <CreateNewTaskContainer
                data-tip
                data-for="createNewTaskTip"
                ref={containerRef}
                onClick={() => setIsFocused(true)}
            >
                {isFocused ? (
                    <CreateNewTaskInput
                        ref={inputRef}
                        placeholder="Add new task"
                        initialValue={text}
                        onEdit={(e) => setText(e)}
                        onBlur={() => setIsFocused(false)}
                        onKeyDown={handleKeyDown}
                        fontSize="small"
                        autoFocus
                    />
                ) : (
                    <InputMimicContainer>
                        <Icon icon={icons.plus} size="small" />
                        <span>Add new task</span>
                    </InputMimicContainer>
                )}
            </CreateNewTaskContainer>
            {!disableTooltip && (
                <ReactTooltip
                    id="createNewTaskTip"
                    place="top"
                    type="light"
                    effect="solid"
                    className="tooltip"
                    overridePosition={overrideTooltipPosition}
                >
                    <Tooltip>
                        <span>Add new task</span>
                        <KeyboardShortcutContainer>{KEYBOARD_SHORTCUTS.createTask}</KeyboardShortcutContainer>
                    </Tooltip>
                </ReactTooltip>
            )}
        </>
    )
}

export default CreateNewTask

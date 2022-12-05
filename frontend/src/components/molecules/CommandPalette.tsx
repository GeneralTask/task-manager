import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import styled from 'styled-components'
import { DEFAULT_SECTION_ID } from '../../constants'
import KEYBOARD_SHORTCUTS, { ShortcutCategories } from '../../constants/shortcuts'
import useShortcutContext from '../../context/ShortcutContext'
import { useKeyboardShortcut, usePreviewMode } from '../../hooks'
import useNavigateToTask from '../../hooks/useNavigateToTask'
import { useGetTasks } from '../../services/api/tasks.hooks'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { TShortcut, TShortcutCategory } from '../../utils/types'
import { stopKeydownPropogation } from '../../utils/utils'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import { KeyboardShortcutContainer } from '../atoms/KeyboardShortcut'
import { Divider } from '../atoms/SectionDivider'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { BodySmall } from '../atoms/typography/Typography'

const COMMAND_PALETTE_WIDTH = '512px'
const COMMAND_PALETTE_MAX_LIST_HEIGHT = '50vh'

const CommandDialog = styled(Command.Dialog)`
    position: absolute;
    top: 15%;
    left: 50%;
    transform: translateX(-50%);
    width: ${COMMAND_PALETTE_WIDTH};
    background-color: ${Colors.background.white};
    box-shadow: ${Shadows.medium};
    border-radius: ${Border.radius.medium};
    padding-bottom: ${Spacing._4};
    z-index: 1500; // should appear over modals
    user-select: none;
`
const Searchbar = styled.div`
    display: flex;
    align-items: center;
    margin: ${Spacing._4} ${Spacing._4} 0;
`
const CommandInput = styled(Command.Input)`
    flex: 1;
    outline: none;
    border: none;
    ${Typography.subtitle};
    &::placeholder {
        color: ${Colors.text.light};
    }
`
const CommandList = styled(Command.List)`
    max-height: ${COMMAND_PALETTE_MAX_LIST_HEIGHT};
    overflow: auto;
`
const CommandGroup = styled(Command.Group)`
    [cmdk-group-heading] {
        ${Typography.label}
        padding: ${Spacing._8} ${Spacing._16};
        color: ${Colors.text.light};
    }
`
const CommandItem = styled(Command.Item)`
    display: flex;
    justify-content: space-between;
    align-items: center;
    ${Typography.bodySmall}
    border-radius: ${Border.radius.small};
    margin: 0 ${Spacing._4};
    cursor: pointer;
    padding-right: ${Spacing._16};
    &[aria-selected='true'] {
        background-color: ${Colors.background.medium};
        & > ${KeyboardShortcutContainer} {
            background-color: ${Colors.background.white};
        }
    }
`
const CommandEmpty = styled(Command.Empty)`
    ${Typography.bodySmall}
    display: flex;
    justify-content: center;
    margin: ${Spacing._8} ${Spacing._8};
`
const IconContainer = styled.div<{ marginLeftAuto?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${Spacing._16};
    ${({ marginLeftAuto }) => marginLeftAuto && 'margin-left: auto'};
`
const TruncatedTitle = styled(BodySmall)<{ strike?: boolean }>`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    position: relative;
    ${({ strike }) => strike && 'text-decoration: line-through'};
`
const FlexWidth100 = styled(Flex)`
    width: 100%;
`
interface CommandPaletteProps {
    hideButton?: boolean
}
const CommandPalette = ({ hideButton }: CommandPaletteProps) => {
    const { showCommandPalette, setShowCommandPalette, activeKeyboardShortcuts } = useShortcutContext()
    const { isPreviewMode } = usePreviewMode()
    const [selectedShortcut, setSelectedShortcut] = useState<string>()
    const [searchValue, setSearchValue] = useState<string>()
    const buttonRef = useRef<HTMLButtonElement>(null)

    const { data: taskFolders } = useGetTasks()
    const navigateToTask = useNavigateToTask()
    const navigate = useNavigate()
    const tasks = useMemo(() => {
        return taskFolders?.flatMap((folder) => folder.tasks) ?? []
    }, [taskFolders])

    /*
        When the command palette is closed, the page seems to lose focus
        So we have to manually focus on an element in the page to make kb shortcuts work
    */
    useEffect(() => {
        if (!showCommandPalette) {
            buttonRef.current?.focus()
        }
    }, [showCommandPalette])

    useKeyboardShortcut(
        'toggleCommandPalette',
        useCallback(() => {
            setShowCommandPalette(!showCommandPalette)
        }, [showCommandPalette, setShowCommandPalette])
    )
    useKeyboardShortcut(
        'closeCommandPalette',
        useCallback(() => setShowCommandPalette(false), [setShowCommandPalette]),
        !showCommandPalette
    )

    const shortcutGroups = useMemo(() => {
        const groups = new Map<TShortcutCategory, TShortcut[]>(ShortcutCategories.map((category) => [category, []]))
        activeKeyboardShortcuts.forEach((shortcut) => {
            if (!shortcut.hideFromCommandPalette) {
                groups.get(shortcut.category)?.push(shortcut)
            }
        })
        return Array.from(groups.entries()).map(([category, shortcuts]) => ({
            category,
            shortcuts,
        }))
    }, [activeKeyboardShortcuts])

    return (
        <>
            {!hideButton && (
                <GTIconButton
                    ref={buttonRef}
                    icon={icons.magnifying_glass}
                    onClick={() => setShowCommandPalette(!showCommandPalette)}
                    shortcutName="toggleCommandPalette"
                />
            )}
            <CommandDialog
                open={showCommandPalette}
                onOpenChange={setShowCommandPalette}
                onKeyDown={(e) => {
                    stopKeydownPropogation(e, [KEYBOARD_SHORTCUTS.closeCommandPalette.key])
                }}
                value={selectedShortcut}
                onValueChange={setSelectedShortcut}
            >
                <Searchbar>
                    <IconContainer>
                        <Icon icon={icons.magnifying_glass} />
                    </IconContainer>
                    <CommandInput
                        placeholder="Type a command or search..."
                        value={searchValue}
                        onValueChange={setSearchValue}
                    />
                </Searchbar>
                <Divider color={Colors.background.dark} />
                <CommandEmpty>No commands found</CommandEmpty>
                <CommandList>
                    {shortcutGroups.map(
                        ({ category, shortcuts }) =>
                            shortcuts.length > 0 && (
                                <CommandGroup heading={category} key={category}>
                                    {shortcuts.map(({ label, action, keyLabel, icon }) => (
                                        <CommandItem
                                            key={keyLabel}
                                            onSelect={() => {
                                                setShowCommandPalette(false)
                                                action()
                                            }}
                                            value={`${label} ${category}`}
                                        >
                                            <Flex flex="1" alignItems="center">
                                                <IconContainer>{icon && <Icon icon={icons[icon]} />}</IconContainer>
                                                <BodySmall>{label}</BodySmall>
                                            </Flex>
                                            <KeyboardShortcutContainer>{keyLabel}</KeyboardShortcutContainer>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )
                    )}
                    {isPreviewMode && searchValue && (
                        <CommandGroup heading={`Search for "${searchValue}"`}>
                            {taskFolders
                                ?.filter((f) => !f.is_done && !f.is_trash && f.id !== DEFAULT_SECTION_ID)
                                .map(({ name, id }) => (
                                    <CommandItem
                                        key={id}
                                        onSelect={() => {
                                            setShowCommandPalette(false)
                                            navigate(`/tasks/${id}`)
                                        }}
                                        value={`${name} ${id}`}
                                    >
                                        <FlexWidth100 alignItems="center">
                                            <IconContainer>
                                                <Icon icon={icons.folder} />
                                            </IconContainer>
                                            <TruncatedTitle>{name}</TruncatedTitle>
                                        </FlexWidth100>
                                    </CommandItem>
                                ))}
                            {tasks.map(({ is_done, is_deleted, title, source, id }) => (
                                <CommandItem
                                    key={id}
                                    onSelect={() => {
                                        setShowCommandPalette(false)
                                        navigateToTask(id)
                                    }}
                                    value={`${title} ${id}`}
                                >
                                    <FlexWidth100 alignItems="center">
                                        <IconContainer>
                                            <Icon icon={logos[source.logo_v2]} />
                                        </IconContainer>
                                        <TruncatedTitle
                                            strike={is_done || is_deleted}
                                            color={is_done || is_deleted ? 'light' : 'black'}
                                        >
                                            {title}
                                        </TruncatedTitle>
                                        {(is_done || is_deleted) && (
                                            <IconContainer marginLeftAuto>
                                                <Icon
                                                    icon={is_done ? icons.check : icons.trash}
                                                    color={is_done ? 'purple' : 'black'}
                                                />
                                            </IconContainer>
                                        )}
                                    </FlexWidth100>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    )
}

export default CommandPalette

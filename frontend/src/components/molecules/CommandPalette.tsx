import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import styled from 'styled-components'
import { DEFAULT_FOLDER_ID, DONE_FOLDER_ID, TRASH_FOLDER_ID } from '../../constants'
import KEYBOARD_SHORTCUTS, { ShortcutCategories } from '../../constants/shortcuts'
import useShortcutContext from '../../context/ShortcutContext'
import { useKeyboardShortcut } from '../../hooks'
import useNavigateToTask from '../../hooks/useNavigateToTask'
import { useGetFolders } from '../../services/api/folders.hooks'
import Log from '../../services/api/log'
import { useGetTasksV4 } from '../../services/api/tasks.hooks'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { icons, logos } from '../../styles/images'
import { TShortcut, TShortcutCategory } from '../../utils/types'
import { stopKeydownPropogation } from '../../utils/utils'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import { KeyboardShortcutContainer } from '../atoms/KeyboardShortcut'
import { Divider } from '../atoms/SectionDivider'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { BodySmall, Label } from '../atoms/typography/Typography'

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
const IconContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${Spacing._16};
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
const RightLabel = styled(Label)`
    margin-left: auto;
`

const BoldMatches = ({ text, query }: { text: string; query: string | undefined }) => {
    if (!query) return <>{text}</>
    const matches = text.match(new RegExp(query, 'gi'))
    if (!matches) return <>{text}</>
    const split = text.split(new RegExp(query, 'gi'))
    return (
        <>
            {split.map((part, i) => (
                <span key={i}>
                    {part}
                    {matches[i] && <strong>{matches[i]}</strong>}
                </span>
            ))}
        </>
    )
}
interface CommandPaletteProps {
    customButton?: React.ReactNode
    hideButton?: boolean
}
const CommandPalette = ({ customButton, hideButton }: CommandPaletteProps) => {
    const { showCommandPalette, setShowCommandPalette, activeKeyboardShortcuts } = useShortcutContext()
    const [selectedShortcut, setSelectedShortcut] = useState<string>()
    const [searchValue, setSearchValue] = useState<string>()

    const { data: allTasks } = useGetTasksV4()
    const { data: folders } = useGetFolders()
    const navigateToTask = useNavigateToTask()
    const navigate = useNavigate()

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
                if (!groups.get(shortcut.category)?.some((s) => s.label === shortcut.label)) {
                    groups.get(shortcut.category)?.push(shortcut)
                }
            }
        })
        return Array.from(groups.entries()).map(([category, shortcuts]) => ({
            category,
            shortcuts,
        }))
    }, [activeKeyboardShortcuts])

    const handleButtonClick = () => {
        setShowCommandPalette(true)
        Log('click_show_command_palette')
    }

    return (
        <>
            {!hideButton &&
                (customButton ? (
                    <div onClick={handleButtonClick}>{customButton}</div>
                ) : (
                    <GTIconButton
                        icon={icons.magnifying_glass}
                        onClick={handleButtonClick}
                        shortcutName="toggleCommandPalette"
                    />
                ))}
            <CommandDialog
                open={showCommandPalette}
                onOpenChange={setShowCommandPalette}
                onKeyDown={(e) => {
                    stopKeydownPropogation(e, [KEYBOARD_SHORTCUTS.closeCommandPalette.key])
                }}
                value={selectedShortcut}
                onValueChange={setSelectedShortcut}
                filter={(value, search) => (value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}
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
                <CommandEmpty>No results found</CommandEmpty>
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
                                                Log(`command_palette_${label.replaceAll(' ', '_').toLowerCase()}`)
                                                action()
                                            }}
                                            value={`${label} ${category}`}
                                        >
                                            <Flex flex="1" alignItems="center">
                                                <IconContainer>{icon && <Icon icon={icons[icon]} />}</IconContainer>
                                                <BodySmall>
                                                    <BoldMatches text={label} query={searchValue} />
                                                </BodySmall>
                                            </Flex>
                                            <KeyboardShortcutContainer>{keyLabel}</KeyboardShortcutContainer>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )
                    )}
                    {searchValue && (
                        <CommandGroup heading={`Search for "${searchValue}"`}>
                            {folders
                                ?.filter((f) => f.id !== DEFAULT_FOLDER_ID)
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
                                                <Icon
                                                    icon={
                                                        id === TRASH_FOLDER_ID
                                                            ? icons.trash
                                                            : id === DONE_FOLDER_ID
                                                            ? icons.checkbox_checked
                                                            : icons.folder
                                                    }
                                                />
                                            </IconContainer>
                                            <TruncatedTitle>
                                                <BoldMatches text={name} query={searchValue} />
                                            </TruncatedTitle>
                                        </FlexWidth100>
                                    </CommandItem>
                                ))}
                            {allTasks?.map(({ is_done, is_deleted, title, source, id }) => (
                                <CommandItem
                                    key={id}
                                    onSelect={() => {
                                        setShowCommandPalette(false)
                                        navigateToTask({ taskId: id })
                                    }}
                                    value={`${title} ${id}`}
                                >
                                    <FlexWidth100 alignItems="center">
                                        <IconContainer>
                                            <Icon icon={logos[source.logo]} />
                                        </IconContainer>
                                        <TruncatedTitle
                                            strike={is_done || is_deleted}
                                            color={is_done || is_deleted ? 'light' : 'black'}
                                        >
                                            <BoldMatches text={title} query={searchValue} />
                                        </TruncatedTitle>
                                        {(is_done || is_deleted) && (
                                            <RightLabel color="light">{is_deleted ? '(deleted)' : '(done)'}</RightLabel>
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

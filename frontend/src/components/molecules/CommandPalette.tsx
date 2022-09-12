import KEYBOARD_SHORTCUTS, { ShortcutCategories } from '../../constants/shortcuts'
import useShortcutContext from '../../context/ShortcutContext'
import { useKeyboardShortcut } from '../../hooks'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { TShortcut, TShortcutCategory } from '../../utils/types'
import { stopKeydownPropogation } from '../../utils/utils'
import Flex from '../atoms/Flex'
import { Icon } from '../atoms/Icon'
import { KeyboardShortcutContainer } from '../atoms/KeyboardShortcut'
import { Divider } from '../atoms/SectionDivider'
import GTIconButton from '../atoms/buttons/GTIconButton'
import { Command } from 'cmdk'
import React, { useCallback, useEffect, useMemo } from 'react'
import styled from 'styled-components'

const COMMAND_PALETTE_WIDTH = '356px'
const COMMAND_PALETTE_MAX_LIST_HEIGHT = '50vh'

const CommandDialog = styled(Command.Dialog)`
    position: absolute;
    top: 15%;
    left: calc(50% - ${COMMAND_PALETTE_WIDTH} / 2);
    width: ${COMMAND_PALETTE_WIDTH};
    background-color: ${Colors.background.white};
    box-shadow: ${Shadows.medium};
    border-radius: ${Border.radius.medium};
    padding-bottom: ${Spacing._4};
    z-index: 1500; // should appear over modals
`
const Searchbar = styled.div`
    display: flex;
    align-items: center;
    margin: ${Spacing._4} ${Spacing._4} 0 ${Spacing._4};
`
const CommandInput = styled(Command.Input)`
    flex: 1;
    outline: none;
    border: none;
    ${Typography.subtitle}
    &::placeholder {
        color: ${Colors.text.placeholder};
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
`
const IconContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: ${Spacing._16};
`

const CommandPalette = () => {
    const { setShowCommandPalette, activeKeyboardShortcuts } = useShortcutContext()
    const [selectedShortcut, setSelectedShortcut] = React.useState('apple')

    useKeyboardShortcut(
        'closeCommandPalette',
        useCallback(() => setShowCommandPalette(false), [setShowCommandPalette])
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
        <CommandDialog
            open
            onOpenChange={setShowCommandPalette}
            onKeyDown={(e) => stopKeydownPropogation(e, [KEYBOARD_SHORTCUTS.closeCommandPalette.key])}
            value={selectedShortcut}
            onValueChange={setSelectedShortcut}
        >
            <Searchbar>
                <IconContainer>
                    <Icon icon={icons.magnifying_glass} size="xSmall" />
                </IconContainer>
                <CommandInput placeholder="Type a command" />
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
                                    >
                                        <Flex alignItemsCenter>
                                            <IconContainer>
                                                {icon && <Icon icon={icons[icon]} size="xSmall" />}
                                            </IconContainer>
                                            {label}
                                        </Flex>
                                        <KeyboardShortcutContainer>{keyLabel}</KeyboardShortcutContainer>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        )
                )}
            </CommandList>
        </CommandDialog>
    )
}

const CommandPaletteButton = () => {
    const { showCommandPalette, setShowCommandPalette } = useShortcutContext()
    const buttonRef = React.useRef<HTMLButtonElement>(null)

    useKeyboardShortcut(
        'toggleCommandPalette',
        useCallback(() => {
            setShowCommandPalette(!showCommandPalette)
        }, [showCommandPalette, setShowCommandPalette])
    )

    /*
        When the command palette is closed, the page seems to lose focus
        So we have to manually focus on an element in the page to make kb shortcuts work
    */
    useEffect(() => {
        if (!showCommandPalette) {
            buttonRef.current?.focus()
        }
    }, [showCommandPalette])

    return (
        <>
            <GTIconButton
                ref={buttonRef}
                icon={icons.magnifying_glass}
                onClick={() => setShowCommandPalette(!showCommandPalette)}
                size={'small'}
            />
            {showCommandPalette && <CommandPalette />}
        </>
    )
}

export default CommandPaletteButton

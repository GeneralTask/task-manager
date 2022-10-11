import { Fragment } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import styled from 'styled-components'
import { Colors } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import { FixedSizeIcon, GTMenuItem, MenuContentShared, MenuItemLabel, MenuItemShared } from './RadixUIConstants'

const DropdownMenuTrigger = styled(DropdownMenu.Trigger)`
    all: unset;
`
const DropdownMenuContent = styled(DropdownMenu.Content)`
    ${MenuContentShared};
`
const DropdownMenuItem = styled(DropdownMenu.Item)<{ $isSelected?: boolean }>`
    ${MenuItemShared};
`

interface GTDropdownMenuProps {
    items: GTMenuItem[] | GTMenuItem[][] // allow for divided groups of items
    trigger: React.ReactNode // component that opens the dropdown menu when clicked
    align?: 'start' | 'end'
    isOpen?: boolean
    setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
    disabled?: boolean
}

const GTDropdownMenu = ({ items, trigger, align = 'start', isOpen, setIsOpen, disabled }: GTDropdownMenuProps) => {
    const groups = (items.length > 0 && Array.isArray(items[0]) ? items : [items]) as GTMenuItem[][]

    return (
        <div onKeyDown={(e) => e.stopPropagation()}>
            <DropdownMenu.Root modal open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger disabled={disabled}>{trigger}</DropdownMenuTrigger>
                <DropdownMenu.Portal>
                    <DropdownMenuContent align={align}>
                        {groups.map((group, groupIndex) => (
                            <Fragment key={groupIndex}>
                                <DropdownMenu.Group>
                                    {group.map((item) => (
                                        <DropdownMenuItem
                                            key={item.label}
                                            textValue={item.label}
                                            onClick={item.onClick}
                                            $isSelected={item.selected && !item.renderer}
                                        >
                                            {item.renderer ? (
                                                item.renderer()
                                            ) : (
                                                <>
                                                    <FixedSizeIcon visible={item.selected}>
                                                        <Icon icon={icons.check} />
                                                    </FixedSizeIcon>
                                                    {item.icon && <Icon icon={item.icon} color={item.iconColor} />}
                                                    <MenuItemLabel>{item.label}</MenuItemLabel>
                                                </>
                                            )}
                                        </DropdownMenuItem>
                                    ))}
                                    {groupIndex !== groups.length - 1 && <Divider color={Colors.background.medium} />}
                                </DropdownMenu.Group>
                            </Fragment>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
        </div>
    )
}

export default GTDropdownMenu

import { Fragment, useRef } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import styled from 'styled-components'
import { Colors } from '../../styles'
import { TTextColor } from '../../styles/colors'
import { icons } from '../../styles/images'
import { emptyFunction, stopKeydownPropogation } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import {
    FixedSizeIcon,
    GTMenuItem,
    MenuContentShared,
    MenuItemLabel,
    MenuItemShared,
    MenuTriggerShared,
} from './RadixUIConstants'

const DropdownMenuTrigger = styled(DropdownMenu.Trigger)`
    ${MenuTriggerShared};
`
const DropdownMenuContent = styled(DropdownMenu.Content)<{ menuInModal?: boolean; width?: number }>`
    ${MenuContentShared};
    ${({ menuInModal }) => menuInModal && `z-index: 1000;`}
    ${({ width }) => width && `width: ${width}px;`}
    box-sizing: border-box;
`
const DropdownMenuItem = styled(DropdownMenu.Item)<{
    textcolor?: TTextColor
    disabled?: boolean
}>`
    ${MenuItemShared};
    width: 100%;
    box-sizing: border-box;
`

interface GTDropdownMenuProps {
    items: GTMenuItem[] | GTMenuItem[][] // allow for divided groups of items
    trigger: React.ReactNode // component that opens the dropdown menu when clicked
    align?: 'start' | 'end'
    isOpen?: boolean
    setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
    disabled?: boolean
    hideCheckmark?: boolean
    menuInModal?: boolean
    useTriggerWidth?: boolean
}

const GTDropdownMenu = ({
    items,
    trigger,
    align = 'start',
    isOpen,
    setIsOpen,
    disabled,
    hideCheckmark = false,
    menuInModal = false,
    useTriggerWidth = false,
}: GTDropdownMenuProps) => {
    const groups = (items.length > 0 && Array.isArray(items[0]) ? items : [items]) as GTMenuItem[][]

    const triggerRef = useRef<HTMLButtonElement>(null)
    return (
        <div>
            <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger ref={triggerRef} disabled={disabled}>
                    {trigger}
                </DropdownMenuTrigger>
                <DropdownMenu.Portal>
                    <DropdownMenuContent
                        onKeyDown={(e) => stopKeydownPropogation(e, ['Escape'], true)}
                        align={align}
                        menuInModal={menuInModal}
                        width={useTriggerWidth ? triggerRef.current?.getBoundingClientRect().width : undefined}
                    >
                        {groups.map((group, groupIndex) => (
                            <Fragment key={groupIndex}>
                                <DropdownMenu.Group>
                                    {group.map((item) => (
                                        <DropdownMenuItem
                                            key={item.label}
                                            textValue={item.label}
                                            onClick={item.disabled ? emptyFunction : item.onClick}
                                            disabled={item.disabled}
                                            textcolor={item.textColor}
                                        >
                                            {item.renderer ? (
                                                item.renderer()
                                            ) : (
                                                <>
                                                    {!hideCheckmark && (
                                                        <FixedSizeIcon visible={item.selected}>
                                                            <Icon icon={icons.check} />
                                                        </FixedSizeIcon>
                                                    )}
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

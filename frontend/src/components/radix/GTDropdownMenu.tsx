import { Fragment, useRef } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import styled from 'styled-components'
import { Colors, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { emptyFunction, stopKeydownPropogation } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import {
    FixedSizeIcon,
    GTMenuItem,
    MarginLeftIcon,
    MenuContentShared,
    MenuItemLabel,
    MenuItemShared,
    MenuTriggerShared,
} from './RadixUIConstants'

const DROPDOWN_MENU_ITEM_MAX_WIDTH = '240px'
const DropdownMenuTrigger = styled(DropdownMenu.Trigger)`
    ${MenuTriggerShared};
`
const DropdownMenuContent = styled(DropdownMenu.Content)<{
    $menuInModal?: boolean
    $width?: number
    $textColor?: string
    $fontStyle?: 'body' | 'bodySmall' | 'label'
}>`
    ${MenuContentShared};
    ${({ $menuInModal }) => $menuInModal && `z-index: 1000;`}
    ${({ $width }) => $width && `width: ${$width}px;`}
    max-width: ${({ $width }) => ($width ? `${$width}px` : `${DROPDOWN_MENU_ITEM_MAX_WIDTH}`)};
    ${({ $textColor }) => $textColor && `color: ${$textColor};`}
    ${({ $fontStyle }) => $fontStyle && Typography[$fontStyle]};
    box-sizing: border-box;
`
const DropdownMenuItem = styled(DropdownMenu.Item)`
    ${MenuItemShared};
    width: 100%;
    box-sizing: border-box;
`
const LeftMarginAutoContainer = styled.span`
    margin-left: auto;
`
const DropdownMenuSubTrigger = styled(DropdownMenu.SubTrigger)`
    ${MenuItemShared};
`
const DropdownMenuSubContent = styled(DropdownMenu.SubContent)`
    ${MenuContentShared};
`
interface GTDropdownMenuProps {
    items: GTMenuItem[] | GTMenuItem[][] // allow for divided groups of items
    trigger: React.ReactNode // component that opens the dropdown menu when clicked
    align?: 'start' | 'end'
    side?: 'top' | 'bottom' | 'left' | 'right'
    isOpen?: boolean
    setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
    disabled?: boolean
    hideCheckmark?: boolean
    menuInModal?: boolean
    useTriggerWidth?: boolean
    unstyledTrigger?: boolean
    keepOpenOnSelect?: boolean
    fontStyle?: 'body' | 'bodySmall' | 'label'
}

const GTDropdownMenu = ({
    items,
    trigger,
    align = 'start',
    side = 'bottom',
    isOpen,
    setIsOpen,
    disabled,
    hideCheckmark = false,
    menuInModal = false,
    useTriggerWidth = false,
    unstyledTrigger = false,
    keepOpenOnSelect = false,
    fontStyle = 'body',
}: GTDropdownMenuProps) => {
    const groups = (items.length > 0 && Array.isArray(items[0]) ? items : [items]) as GTMenuItem[][]

    const triggerRef = useRef<HTMLButtonElement>(null)
    return (
        <div>
            <DropdownMenu.Root open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger ref={triggerRef} disabled={disabled} $unstyled={unstyledTrigger}>
                    {trigger}
                </DropdownMenuTrigger>
                <DropdownMenu.Portal>
                    <DropdownMenuContent
                        onKeyDown={(e) => stopKeydownPropogation(e, ['Escape'], true)}
                        align={align}
                        $menuInModal={menuInModal}
                        $width={useTriggerWidth ? triggerRef.current?.getBoundingClientRect().width : undefined}
                        $fontStyle={fontStyle}
                        side={side}
                    >
                        {groups.map((group, groupIndex) => (
                            <Fragment key={groupIndex}>
                                <DropdownMenu.Group>
                                    {group.map((item) => (
                                        <Fragment key={item.label}>
                                            {item.subItems ? (
                                                <DropdownMenu.Sub>
                                                    <DropdownMenuSubTrigger
                                                        key={item.label}
                                                        onClick={item.onClick}
                                                        $textColor={item.textColor}
                                                    >
                                                        {item.icon && <Icon icon={item.icon} color={item.iconColor} />}
                                                        <MenuItemLabel>{item.label}</MenuItemLabel>
                                                        <MarginLeftIcon>
                                                            <Icon icon={icons.caret_right} />
                                                        </MarginLeftIcon>
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenu.Portal>
                                                        <DropdownMenuSubContent>
                                                            {item.subItems.map((subItem) => (
                                                                <DropdownMenuItem
                                                                    key={subItem.label}
                                                                    textValue={subItem.label}
                                                                    onClick={
                                                                        subItem.disabled
                                                                            ? emptyFunction
                                                                            : subItem.onClick
                                                                    }
                                                                    $disabled={subItem.disabled}
                                                                    $textColor={subItem.textColor}
                                                                    onSelect={
                                                                        subItem.keepOpenOnSelect ||
                                                                        keepOpenOnSelect ||
                                                                        subItem.disabled
                                                                            ? (e) => e.preventDefault()
                                                                            : emptyFunction
                                                                    }
                                                                >
                                                                    {subItem.renderer ? (
                                                                        subItem.renderer()
                                                                    ) : (
                                                                        <>
                                                                            {!hideCheckmark && !subItem.hideCheckmark && (
                                                                                <FixedSizeIcon
                                                                                    visible={subItem.selected}
                                                                                >
                                                                                    <Icon icon={icons.check} />
                                                                                </FixedSizeIcon>
                                                                            )}
                                                                            {subItem.icon && (
                                                                                <Icon
                                                                                    icon={subItem.icon}
                                                                                    color={subItem.iconColor}
                                                                                />
                                                                            )}
                                                                            <MenuItemLabel>
                                                                                {subItem.label}
                                                                            </MenuItemLabel>
                                                                            {subItem.count && (
                                                                                <LeftMarginAutoContainer>
                                                                                    ({subItem.count})
                                                                                </LeftMarginAutoContainer>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenu.Portal>
                                                </DropdownMenu.Sub>
                                            ) : (
                                                <DropdownMenuItem
                                                    key={item.label}
                                                    textValue={item.label}
                                                    onClick={item.disabled ? emptyFunction : item.onClick}
                                                    $disabled={item.disabled}
                                                    $textColor={item.textColor}
                                                    onSelect={
                                                        item.keepOpenOnSelect || keepOpenOnSelect || item.disabled
                                                            ? (e) => e.preventDefault()
                                                            : emptyFunction
                                                    }
                                                >
                                                    {item.renderer ? (
                                                        item.renderer()
                                                    ) : (
                                                        <>
                                                            {!hideCheckmark && !item.hideCheckmark && (
                                                                <FixedSizeIcon visible={item.selected}>
                                                                    <Icon icon={icons.check} />
                                                                </FixedSizeIcon>
                                                            )}
                                                            {item.icon && (
                                                                <Icon icon={item.icon} color={item.iconColor} />
                                                            )}
                                                            <MenuItemLabel>{item.label}</MenuItemLabel>
                                                            {item.count && (
                                                                <LeftMarginAutoContainer>
                                                                    ({item.count})
                                                                </LeftMarginAutoContainer>
                                                            )}
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                            )}
                                        </Fragment>
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

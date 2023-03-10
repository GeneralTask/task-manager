import { Fragment, useCallback, useRef } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import styled from 'styled-components'
import { Colors, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { emptyFunction, stopKeydownPropogation } from '../../utils/utils'
import { Icon } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import { DeprecatedLabel } from '../atoms/typography/Typography'
import {
    FixedSizeIcon,
    GTMenuItem,
    MarginLeftIcon,
    MenuContentShared,
    MenuItemLabel,
    MenuItemShared,
    MenuTriggerShared,
} from './RadixUIConstants'
import Tip from './Tip'

const DROPDOWN_MENU_ITEM_MAX_WIDTH = '240px'
const DROPDOWN_MENU_ITEM_MAX_HEIGHT = '75vh'
const DropdownMenuTrigger = styled(DropdownMenu.Trigger)`
    ${MenuTriggerShared};
`
const DropdownMenuContent = styled(DropdownMenu.Content)<{
    $menuInModal?: boolean
    $width?: number
    $textColor?: string
    $fontStyle?: 'deprecated_body' | 'deprecated_bodySmall' | 'deprecated_label'
}>`
    ${MenuContentShared};
    max-height: ${DROPDOWN_MENU_ITEM_MAX_HEIGHT};
    overflow: auto;
    ${({ $menuInModal }) => $menuInModal && `z-index: 1000;`}
    ${({ $width }) => $width && `width: ${$width}px;`}
    max-width: ${({ $width }) => ($width ? `${$width}px` : `${DROPDOWN_MENU_ITEM_MAX_WIDTH}`)};
    ${({ $textColor }) => $textColor && `color: ${$textColor};`}
    ${({ $fontStyle }) => $fontStyle && Typography[$fontStyle]};
    box-sizing: border-box;
    z-index: 10000; // higher than toast z-index of 9999
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
    user-select: none;
`
const Description = styled(DeprecatedLabel)`
    padding: ${Spacing._8} ${Spacing._12};
    display: block;
`

const getItemKey = (item: GTMenuItem) => `${item.label}${item.icon}${item.iconColor}${item.iconColorHex}`

interface GTDropdownMenuProps {
    items: GTMenuItem[] | GTMenuItem[][] // allow for divided groups of items
    trigger: React.ReactNode // component that opens the dropdown menu when clicked
    align?: 'start' | 'center' | 'end'
    side?: 'top' | 'bottom' | 'left' | 'right'
    isOpen?: boolean
    setIsOpen?: React.Dispatch<React.SetStateAction<boolean>>
    disabled?: boolean
    hideCheckmark?: boolean
    menuInModal?: boolean
    useTriggerWidth?: boolean
    unstyledTrigger?: boolean
    keepOpenOnSelect?: boolean
    fontStyle?: 'deprecated_body' | 'deprecated_bodySmall' | 'deprecated_label'
    description?: string
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
    fontStyle = 'deprecated_body',
    description,
}: GTDropdownMenuProps) => {
    const groups = (items.length > 0 && Array.isArray(items[0]) ? items : [items]) as GTMenuItem[][]

    const ConditionalTooltip = useCallback(
        ({ children, tip }: { children: React.ReactNode; tip?: string }) =>
            tip ? (
                <Tip content={tip} side="right">
                    {children}
                </Tip>
            ) : (
                <>{children}</>
            ),
        []
    )

    const triggerRef = useRef<HTMLButtonElement>(null)
    return (
        <div onClick={(e) => e.stopPropagation()}>
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
                                        <Fragment key={getItemKey(item)}>
                                            {item.subItems ? (
                                                <DropdownMenu.Sub>
                                                    <DropdownMenuSubTrigger
                                                        key={getItemKey(item)}
                                                        onClick={item.onClick}
                                                        $textColor={item.textColor}
                                                    >
                                                        {item.icon && (
                                                            <Icon
                                                                icon={item.icon}
                                                                color={item.iconColor}
                                                                colorHex={item.iconColorHex}
                                                            />
                                                        )}
                                                        <MenuItemLabel>{item.label}</MenuItemLabel>
                                                        <MarginLeftIcon>
                                                            <Icon icon={icons.caret_right} />
                                                        </MarginLeftIcon>
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenu.Portal>
                                                        <DropdownMenuSubContent>
                                                            {item.subItems.map((subItem) => (
                                                                <ConditionalTooltip
                                                                    key={getItemKey(subItem)}
                                                                    tip={subItem.tip}
                                                                >
                                                                    <DropdownMenuItem
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
                                                                                {!hideCheckmark &&
                                                                                    !subItem.hideCheckmark && (
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
                                                                                        colorHex={subItem.iconColorHex}
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
                                                                </ConditionalTooltip>
                                                            ))}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenu.Portal>
                                                </DropdownMenu.Sub>
                                            ) : (
                                                <ConditionalTooltip key={getItemKey(item)} tip={item.tip}>
                                                    <DropdownMenuItem
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
                                                                    <Icon
                                                                        icon={item.icon}
                                                                        color={item.iconColor}
                                                                        colorHex={item.iconColorHex}
                                                                    />
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
                                                </ConditionalTooltip>
                                            )}
                                        </Fragment>
                                    ))}
                                    {groupIndex !== groups.length - 1 && <Divider color={Colors.background.medium} />}
                                </DropdownMenu.Group>
                            </Fragment>
                        ))}
                        {description && (
                            <>
                                <Divider color={Colors.background.medium} />
                                <Description color="light">{description}</Description>
                            </>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu.Portal>
            </DropdownMenu.Root>
        </div>
    )
}

export default GTDropdownMenu

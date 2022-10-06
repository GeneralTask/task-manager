import { Fragment } from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import styled from 'styled-components'
import { TTextColor } from '../../styles/colors'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import {
    FixedSizeIcon,
    GTMenuItem,
    MarginLeftIcon,
    MenuContentShared,
    MenuItemLabel,
    MenuItemShared,
} from './RadixUIConstants'

const ContextMenuTrigger = styled(ContextMenu.Trigger)`
    all: unset;
`
const ContextMenuContent = styled(ContextMenu.Content)`
    ${MenuContentShared};
`
const ContextMenuSubContent = styled(ContextMenu.SubContent)`
    ${MenuContentShared};
`
const ContextMenuItem = styled(ContextMenu.Item)<{ $isSelected?: boolean; $textColor?: TTextColor }>`
    ${MenuItemShared};
`
const ContextMenuSubTrigger = styled(ContextMenu.SubTrigger)<{ $isSelected?: boolean; $textColor?: TTextColor }>`
    ${MenuItemShared};
`

interface GTContextMenuProps {
    items: GTMenuItem[]
    trigger: React.ReactNode // component that opens the dropdown menu when clicked
}
const GTContextMenu = ({ items, trigger }: GTContextMenuProps) => {
    return (
        <div onKeyDown={(e) => e.stopPropagation()} style={{ width: '100%' }}>
            <ContextMenu.Root>
                <ContextMenuTrigger>{trigger}</ContextMenuTrigger>
                <ContextMenu.Portal>
                    <ContextMenuContent>
                        {items.map((item) => (
                            <Fragment key={item.label}>
                                {item.subItems ? (
                                    <ContextMenu.Sub>
                                        <ContextMenuSubTrigger
                                            key={item.label}
                                            onClick={item.onClick}
                                            $isSelected={item.selected}
                                            $textColor={item.textColor}
                                        >
                                            {item.icon && <Icon icon={item.icon} color={item.iconColor} />}
                                            <MenuItemLabel>{item.label}</MenuItemLabel>
                                            <MarginLeftIcon>
                                                <Icon icon={icons.caret_right} />
                                            </MarginLeftIcon>
                                        </ContextMenuSubTrigger>
                                        <ContextMenu.Portal>
                                            <ContextMenuSubContent>
                                                {item.subItems.map((subItem) =>
                                                    subItem.renderer ? (
                                                        <Fragment key={subItem.label}>{subItem.renderer()}</Fragment>
                                                    ) : (
                                                        <ContextMenuItem
                                                            key={subItem.label}
                                                            textValue={subItem.label}
                                                            onClick={subItem.onClick}
                                                            $isSelected={subItem.selected}
                                                        >
                                                            <FixedSizeIcon visible={subItem.selected}>
                                                                <Icon icon={icons.check} />
                                                            </FixedSizeIcon>
                                                            {subItem.icon && (
                                                                <Icon icon={subItem.icon} color={subItem.iconColor} />
                                                            )}
                                                            <MenuItemLabel>{subItem.label}</MenuItemLabel>
                                                        </ContextMenuItem>
                                                    )
                                                )}
                                            </ContextMenuSubContent>
                                        </ContextMenu.Portal>
                                    </ContextMenu.Sub>
                                ) : (
                                    <ContextMenuItem
                                        key={item.label}
                                        textValue={item.label}
                                        onClick={item.onClick}
                                        $isSelected={item.selected}
                                        $textColor={item.textColor}
                                    >
                                        {item.icon && <Icon icon={item.icon} color={item.iconColor} />}
                                        {item.label}
                                        {item.selected && (
                                            <MarginLeftIcon>
                                                <Icon icon={icons.check} />
                                            </MarginLeftIcon>
                                        )}
                                    </ContextMenuItem>
                                )}
                            </Fragment>
                        ))}
                    </ContextMenuContent>
                </ContextMenu.Portal>
            </ContextMenu.Root>
        </div>
    )
}

export default GTContextMenu

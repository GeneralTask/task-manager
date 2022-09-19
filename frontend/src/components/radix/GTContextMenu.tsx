import { Fragment } from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import styled from 'styled-components'
import { TTextColor } from '../../styles/colors'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { GTMenuItem, MarginLeftIcon, MenuContentShared, MenuItemShared } from './RadixUIConstants'

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
                                            {item.icon && (
                                                <Icon size="xSmall" icon={item.icon} color={item.iconColor} />
                                            )}
                                            {item.label}
                                            <MarginLeftIcon>
                                                <Icon size="xSmall" icon={icons.caret_right} />
                                            </MarginLeftIcon>
                                        </ContextMenuSubTrigger>
                                        <ContextMenu.Portal>
                                            <ContextMenuSubContent>
                                                {item.subItems.map((subItem) => (
                                                    <ContextMenuItem
                                                        key={subItem.label}
                                                        textValue={subItem.label}
                                                        onClick={subItem.onClick}
                                                        $isSelected={subItem.selected}
                                                    >
                                                        {subItem.icon && (
                                                            <Icon
                                                                size="xSmall"
                                                                icon={subItem.icon}
                                                                color={subItem.iconColor}
                                                            />
                                                        )}
                                                        {subItem.label}
                                                        {subItem.selected && (
                                                            <MarginLeftIcon>
                                                                <Icon size="xSmall" icon={icons.check} />
                                                            </MarginLeftIcon>
                                                        )}
                                                    </ContextMenuItem>
                                                ))}
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
                                        {item.icon && <Icon size="xSmall" icon={item.icon} color={item.iconColor} />}
                                        {item.label}
                                        {item.selected && (
                                            <MarginLeftIcon>
                                                <Icon size="xSmall" icon={icons.check} />
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

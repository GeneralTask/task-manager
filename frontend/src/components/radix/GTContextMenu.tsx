import { Fragment } from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import styled from 'styled-components'
import { TIconColor, TTextColor } from '../../styles/colors'
import { icons } from '../../styles/images'
import { Icon, TIconType } from '../atoms/Icon'
import { MenuContentShared, MenuItemShared } from './RadixUIStyles'

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
const RightIcon = styled.div`
    margin-left: auto;
`

export interface GTContextMenuItem {
    label: string
    onClick?: () => void
    icon?: TIconType
    iconColor?: TIconColor
    textColor?: TTextColor
    selected?: boolean
    subItems?: GTContextMenuItem[]
}

interface GTContextMenuProps {
    items: GTContextMenuItem[]
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
                                            <RightIcon>
                                                <Icon size="xSmall" icon={icons.caret_right} />
                                            </RightIcon>
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
                                                            <RightIcon>
                                                                <Icon size="xSmall" icon={icons.check} />
                                                            </RightIcon>
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
                                            <RightIcon>
                                                <Icon size="xSmall" icon={icons.check} />
                                            </RightIcon>
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

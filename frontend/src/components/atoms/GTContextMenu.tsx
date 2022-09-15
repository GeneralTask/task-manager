import { Fragment } from 'react'
import * as ContextMenu from '@radix-ui/react-context-menu'
import styled, { css } from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { TIconColor, TTextColor } from '../../styles/colors'
import { icons } from '../../styles/images'
import { Icon, TIconType } from './Icon'

const CONTEXT_MENU_WIDTH = '172px'

const ContextMenuTrigger = styled(ContextMenu.Trigger)`
    all: unset;
`
const ContextMenuContentShared = css`
    z-index: 5;
    ${Typography.body};
    padding: ${Spacing._4};
    width: ${CONTEXT_MENU_WIDTH};
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.mini};
    box-shadow: ${Shadows.light};
`
const ContextMenuContent = styled(ContextMenu.Content)`
    ${ContextMenuContentShared};
`
const ContextMenuSubContent = styled(ContextMenu.SubContent)`
    ${ContextMenuContentShared};
`
const ContextMenuItemShared = css<{ $isSelected?: boolean; $textColor?: TTextColor }>`
    display: flex;
    align-items: center;
    gap: ${Spacing._12};
    flex: 1;
    margin: ${Spacing._4} 0;
    padding: ${Spacing._4} ${Spacing._12};
    cursor: pointer;
    outline: none;
    border-radius: ${Border.radius.mini};
    white-space: nowrap;
    overflow: clip;
    text-overflow: ellipsis;
    ${({ $textColor }) => $textColor && `color: ${Colors.text[$textColor]};`}
    ${({ $isSelected }) => $isSelected && `background-color: ${Colors.background.medium};`}
    :hover, :focus {
        background-color: ${Colors.background.dark};
    }
`
const ContextMenuItem = styled(ContextMenu.Item)<{ $isSelected?: boolean; $textColor?: TTextColor }>`
    ${ContextMenuItemShared};
`
const ContextMenuSubTrigger = styled(ContextMenu.SubTrigger)<{ $isSelected?: boolean; $textColor?: TTextColor }>`
    ${ContextMenuItemShared};
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

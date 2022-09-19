import { Fragment } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import styled from 'styled-components'
import { Colors } from '../../styles'
import { icons } from '../../styles/images'
import { Icon, TIconType } from '../atoms/Icon'
import { Divider } from '../atoms/SectionDivider'
import { MenuContentShared, MenuItemShared } from './RadixUIStyles'

const DropdownMenuTrigger = styled(DropdownMenu.Trigger)`
    all: unset;
`
const DropdownMenuContent = styled(DropdownMenu.Content)`
    ${MenuContentShared};
`
const DropdownMenuItem = styled(DropdownMenu.Item)<{ $isSelected?: boolean }>`
    ${MenuItemShared};
`
const SelectedIcon = styled.div`
    margin-left: auto;
`

export interface GTDropdownMenuItem {
    label: string
    onClick?: () => void
    icon?: TIconType
    selected?: boolean
    renderer?: () => JSX.Element // override how the option is rendered
}
interface GTDropdownMenuProps {
    items: GTDropdownMenuItem[] | GTDropdownMenuItem[][] // allow for divided groups of items
    trigger: React.ReactNode // component that opens the dropdown menu when clicked
    align?: 'start' | 'end'
}

const GTDropdownMenu = ({ items, trigger, align = 'start' }: GTDropdownMenuProps) => {
    const groups = (items.length > 0 && Array.isArray(items[0]) ? items : [items]) as GTDropdownMenuItem[][]

    return (
        <div onKeyDown={(e) => e.stopPropagation()}>
            <DropdownMenu.Root>
                <DropdownMenuTrigger>{trigger}</DropdownMenuTrigger>
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
                                                    {item.icon && <Icon size="xSmall" icon={item.icon} />}
                                                    {item.label}
                                                    {item.selected && (
                                                        <SelectedIcon>
                                                            <Icon size="xSmall" icon={icons.check} />
                                                        </SelectedIcon>
                                                    )}
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

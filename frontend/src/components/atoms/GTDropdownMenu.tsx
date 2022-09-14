import { Fragment } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { Icon, TIconType } from './Icon'
import { Divider } from './SectionDivider'

const DROPDOWN_MENU_WIDTH = '172px'

const DropdownMenuTrigger = styled(DropdownMenu.Trigger)`
    all: unset;
`
const DropdownMenuContent = styled(DropdownMenu.Content)`
    z-index: 5;
    ${Typography.body};
    width: ${DROPDOWN_MENU_WIDTH};
    padding: ${Spacing._4};
    background-color: ${Colors.background.white};
    border-radius: ${Border.radius.mini};
    box-shadow: ${Shadows.light};
`
const DropdownMenuItem = styled(DropdownMenu.Item)<{ isSelected?: boolean }>`
    display: flex;
    align-items: center;
    gap: ${Spacing._12};
    flex: 1;
    margin: ${Spacing._4} 0;
    padding: ${Spacing._4} ${Spacing._12};
    cursor: pointer;
    outline: none;
    border-radius: ${Border.radius.mini};
    ${({ isSelected }) => isSelected && `background-color: ${Colors.background.medium};`}
    :hover, :focus {
        background-color: ${Colors.background.dark};
    }
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
    // secondaryItemGroup?: GTDropdownMenuItem[]
}

const GTDropdownMenu = ({
    items,
    trigger,
    align = 'start',
}: // secondaryItemGroup,
GTDropdownMenuProps) => {
    const groups = (items.length > 0 && Array.isArray(items[0]) ? items : [items]) as GTDropdownMenuItem[][]

    return (
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
                                        isSelected={item.selected && !item.renderer}
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
    )
}

export default GTDropdownMenu

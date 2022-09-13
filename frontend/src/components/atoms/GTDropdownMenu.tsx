import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { SORT_DIRECTION } from '../../utils/enums'
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
const DropdownMenuItem = styled(DropdownMenu.Item) <{ isSelected?: boolean }>`
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
    items: GTDropdownMenuItem[]
    trigger: React.ReactNode // component that opens the dropdown menu when clicked
    align?: 'start' | 'end'
    showSortDirection?: boolean
    sortDirection?: SORT_DIRECTION
    onSortDirectionChange?: (direction: SORT_DIRECTION) => void
}

const GTDropdownMenu = ({
    items,
    trigger,
    align = 'start',
    showSortDirection,
    sortDirection,
    onSortDirectionChange,
}: GTDropdownMenuProps) => {
    return (
        <DropdownMenu.Root>
            <DropdownMenuTrigger>{trigger}</DropdownMenuTrigger>
            <DropdownMenu.Portal>
                <DropdownMenuContent align={align}>
                    <DropdownMenu.Group>
                        {items.map((item) => (
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
                    </DropdownMenu.Group>
                    {showSortDirection && (
                        <>
                            <Divider color={Colors.background.medium} />
                            <DropdownMenu.Group>
                                <DropdownMenuItem
                                    onClick={() => onSortDirectionChange?.(SORT_DIRECTION.ASC)}
                                    isSelected={sortDirection === SORT_DIRECTION.ASC}
                                >
                                    <Icon size="xSmall" icon={icons.arrow_up} />
                                    Ascending
                                    {sortDirection === SORT_DIRECTION.ASC && (
                                        <SelectedIcon>
                                            <Icon size="xSmall" icon={icons.check} />
                                        </SelectedIcon>
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => onSortDirectionChange?.(SORT_DIRECTION.DESC)}
                                    isSelected={sortDirection === SORT_DIRECTION.DESC}
                                >
                                    <Icon size="xSmall" icon={icons.arrow_down} />
                                    Descending
                                    {sortDirection === SORT_DIRECTION.DESC && (
                                        <SelectedIcon>
                                            <Icon size="xSmall" icon={icons.check} />
                                        </SelectedIcon>
                                    )}
                                </DropdownMenuItem>
                            </DropdownMenu.Group>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    )
}

export default GTDropdownMenu

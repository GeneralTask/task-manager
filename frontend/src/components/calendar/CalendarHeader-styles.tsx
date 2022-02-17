import styled from 'styled-components'
import { ACCENT_ACTIVE, ACCENT_MAIN, GRAY_100, GRAY_200, GRAY_400, GRAY_800, ICON_HOVER } from '../../helpers/styles'
import { StylesConfig } from 'react-select'

export const CalendarHeaderContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
`
export const HeaderTopContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    border-bottom: 2px solid ${GRAY_200};
`
export const HeaderMiddleContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
`
export const HeaderBottomContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0px 24px;
`
export const CalendarHeaderTitle = styled.span`
    font-size: 18px;
    font-weight: 600;
    color: ${GRAY_800};
    line-height: 1.6em;
`
export const DateDisplay = styled.div`
    font-size: 20px;
    font-weight: 600;
    text-align: center;
`
export const HoverButton = styled.button<{ main?: boolean }>`
    cursor: pointer;
    height: fit-content;
    width: fit-content;
    border: none;
    border-radius: 50vh;
    padding: 4px 8px;
    display: flex;
    align-items: center;
    justify-content: center;

    color: ${(props) => (props.main ? 'white' : 'black')};

    background-color: ${(props) => (props.main ? ACCENT_MAIN : 'transparent')};

    &:hover {
        background: ${(props) => (props.main ? ACCENT_ACTIVE : ICON_HOVER)};
    }
`
export const Icon = styled.img`
    height: 24px;
    width: 24px;
`

export const dropdownStyles: StylesConfig<Record<string, unknown>, false> = {
    container: (provided) => ({
        ...provided,
    }),
    control: (provided) => ({
        ...provided,
        fontWeight: 'bold',
        color: GRAY_800,
        border: 'none',
        background: 'transparent',
        width: 120,
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    option: (provided, state) => ({
        ...provided,
        fontWeight: 'bold',
        color: state.isSelected ? GRAY_800 : GRAY_400,
        background: state.isSelected || state.isFocused ? GRAY_100 : '#fff',
        borderRadius: '12px',
        padding: 10,
    }),
    menuList: (provided) => ({
        ...provided,
        padding: 10,
    }),
}

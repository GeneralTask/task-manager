import styled from 'styled-components'
import { Border, Colors, Spacing } from '../../../../styles'

export const TOOLBAR_HEIGHT = '40px'

export const MenuContainer = styled.div`
    display: flex;
    height: ${TOOLBAR_HEIGHT};
    align-items: center;
    background-color: ${Colors.background.medium};
    padding: 0 ${Spacing._8};
    border-bottom-left-radius: ${Border.radius.small};
    border-bottom-right-radius: ${Border.radius.small};
    gap: ${Spacing._8};
    bottom: 0;
    left: 0;
    right: 0;
    overflow-x: auto;
`
export const Divider = styled.div`
    border-left: ${Border.stroke.large} solid ${Colors.border.light};
    height: ${Spacing._16};
`
export const MarginLeftGap = styled.div`
    margin-left: auto !important;
    gap: ${Spacing._8};
`

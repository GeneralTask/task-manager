import styled, { keyframes } from 'styled-components'
import { Border, Colors, Shadows, Spacing, Typography } from '../../../styles'

export const TOAST_MAX_WIDTH = '480px'

export const OuterToastContainer = styled.div<{ backgroundColor: string; visible: boolean }>`
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${Spacing._8};
    padding: ${Spacing._16};
    min-height: ${Spacing._48};
    max-width: ${TOAST_MAX_WIDTH};
    border: ${Border.stroke.medium} solid ${Colors.background.border};
    border-radius: ${Border.radius.small};
    background-color: ${({ backgroundColor }) => backgroundColor};
    box-shadow: ${Shadows.l};
    color: ${Colors.text.base};
    opacity: ${({ visible }) => (visible ? 1 : 0)};
    animation: ${({ visible }) => (visible ? enter : leave)} 0.2s ease-in-out;
    ${Typography.body.small};
`

const enter = keyframes`
    from {
        transform: scale(0.9);
        opacity: 0;
    }
    to {
        transform: scale(1);
        opacity: 1;
    }
`
const leave = keyframes`
    from {
        transform: scale(1);
        opacity: 1;
    }
    to {
        transform: scale(0.9);
        opacity: 0;
    }
`

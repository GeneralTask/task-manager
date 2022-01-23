import React from 'react'
import styled from 'styled-components'
import { TOOLSTIP_BACKGROUND, TOOLSTIP_OPACITY, TOOLSTIP_SHADOW } from '../../helpers/styles'

const RelativeDiv = styled.div`
    position: relative;
`
const TooltipContainer = styled.div<{ show: boolean, direction: string }>`
    visibility: ${props => props.show ? 'visible' : 'hidden'};
    position: absolute;
    pointer-events: none;
    padding: 6px 6px 6px 8px;
    box-shadow: ${TOOLSTIP_SHADOW};
    opacity: ${TOOLSTIP_OPACITY};
    background-color: ${TOOLSTIP_BACKGROUND};
    text-align: center;
    border-radius: 6px;
    z-index: 1;
    width: max-content;
    left: 50%;
    transform: translate(-50%, -50%);
    &::after {
        content: "";
        position: absolute;
        ${props => props.direction === 'above' ? 'top: 100%' : 'bottom: 100%'};
        left: 50%;
        margin-left: -5px;
        border-width: 5px;
        border-style: solid;
        border-color: ${props => props.direction === 'above' ?
        `${TOOLSTIP_BACKGROUND} transparent transparent transparent ` :
        `transparent transparent ${TOOLSTIP_BACKGROUND} transparent `};
        opacity: ${TOOLSTIP_OPACITY};
    }
    ${props => props.direction === 'above' ? 'top: calc(25px * -1);' : 'top: 100%;'}
`
interface TooltipProps {
    children: JSX.Element | JSX.Element[],
    text: string,
    direction?: 'above' | 'below',
}
function Tooltip(props: TooltipProps): JSX.Element {
    let timeout: NodeJS.Timeout | undefined
    const [show, setShow] = React.useState(false)

    const showToolTip = () => {
        timeout = setTimeout(() => {
            setShow(true)
        }, 1000)
    }
    const hideToolTip = () => {
        if (timeout) {
            clearTimeout(timeout)
        }
        setShow(false)
    }
    return <RelativeDiv onMouseEnter={showToolTip} onMouseLeave={hideToolTip}>
        {props.children}
        <TooltipContainer show={show} direction={props.direction || 'above'} >{props.text}</TooltipContainer>
    </RelativeDiv>
}

export default Tooltip

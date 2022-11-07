import { ReactElement, useEffect, useRef } from 'react'
import ReactDOMServer from 'react-dom/server'
import ReactTooltip from 'react-tooltip'
import styled from 'styled-components'

const Wrapper = styled.div<{ inline?: boolean }>`
    display: ${({ inline }) => (inline ? 'inline-block' : 'block')};
`

interface TooltipWrapperProps {
    children: ReactElement
    dataTip: string | ReactElement // using ReactElement because it is required by ReactDOMServer.renderToString
    tooltipId: string
    inline?: boolean
    // for manual control - if true, tooltip will be shown, if false, it will never be shown
    forceShow?: boolean
}
const TooltipWrapper = ({ children, dataTip, tooltipId, inline, forceShow }: TooltipWrapperProps) => {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (ref.current == null || forceShow === undefined) return
        if (forceShow) {
            ReactTooltip.show(ref.current)
        } else {
            ReactTooltip.hide(ref.current)
        }
    }, [forceShow])

    if (forceShow === false) {
        return children
    }

    const tipContent = typeof dataTip === 'string' ? dataTip : ReactDOMServer.renderToString(dataTip)

    return (
        <Wrapper ref={ref} inline={inline} data-tip={tipContent} data-for={tooltipId} data-html={true}>
            {children}
        </Wrapper>
    )
}

export default TooltipWrapper

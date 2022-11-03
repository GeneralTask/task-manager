import { useEffect, useRef } from 'react'
import ReactTooltip from 'react-tooltip'

interface TooltipWrapperProps {
    children: JSX.Element
    dataTip: string
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
    if (inline)
        return (
            <span ref={ref} data-tip={dataTip} data-for={tooltipId} data-html={true}>
                {children}
            </span>
        )
    return (
        <div ref={ref} data-tip={dataTip} data-for={tooltipId} data-html={true}>
            {children}
        </div>
    )
}

export default TooltipWrapper

import { useEffect } from 'react'
import ReactTooltip from 'react-tooltip'

interface TooltipWrapperProps {
    children: JSX.Element
    dataTip: string
    tooltipId: string
    inline?: boolean
}
const TooltipWrapper = ({ children, dataTip, tooltipId, inline }: TooltipWrapperProps) => {
    useEffect(() => {
        return () => {
            ReactTooltip.hide()
        }
    }, [])
    if (inline)
        return (
            <span data-tip={dataTip} data-for={tooltipId} data-html={true}>
                {children}
            </span>
        )
    return (
        <div data-tip={dataTip} data-for={tooltipId} data-html={true}>
            {children}
        </div>
    )
}

export default TooltipWrapper

import React from 'react'
import { Platform } from 'react-native'

interface TooltipWrapperProps {
    children: JSX.Element
    dataTip: string
    tooltipId: string
    inline?: boolean
}
const TooltipWrapper = ({ children, dataTip, tooltipId, inline }: TooltipWrapperProps) => {
    if (Platform.OS !== 'web') return children

    return React.createElement(
        inline ? 'span' : 'div',
        {
            'data-tip': dataTip,
            'data-for': tooltipId,
        },
        children
    )
}

export default TooltipWrapper

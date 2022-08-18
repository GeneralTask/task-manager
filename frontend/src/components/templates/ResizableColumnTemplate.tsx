import React from 'react'
import { Resizable, ResizeCallbackData } from 'react-resizable'

interface ResizableColumnTemplateProps {
    children: React.ReactNode
    initialWidth: number
    maxWidth?: number
    minWidth?: number
    saveWidth?: (width: number) => void
}
const ResizableColumnTemplate = ({
    children,
    initialWidth,
    maxWidth,
    minWidth,
    saveWidth,
}: ResizableColumnTemplateProps) => {
    const [width, setWidth] = React.useState(initialWidth)

    const onResize = (_: React.SyntheticEvent, { size }: ResizeCallbackData) => setWidth(size.width)
    const onResizeStop = (_: React.SyntheticEvent, { size }: ResizeCallbackData) => saveWidth && saveWidth(size.width)

    return (
        <Resizable
            width={width}
            height={100}
            axis="x"
            resizeHandles={['e']}
            onResize={onResize}
            onResizeStop={onResizeStop}
            maxConstraints={maxWidth ? [maxWidth, 0] : undefined}
            minConstraints={minWidth ? [minWidth, 0] : undefined}
        >
            <div style={{ width: `${width}px`, height: '100%' }}>{children}</div>
        </Resizable>
    )
}

export default ResizableColumnTemplate

import { useRef } from 'react'
import styled from 'styled-components'
import { Border, Colors, Shadows } from '../../../styles'
import { stopKeydownPropogation } from '../../../utils/utils'
import MarkdownEditor from './MarkdownEditor/MarkdownEditor'
import PlainTextEditor from './PlainTextEditor'
import { GTTextFieldProps } from './types'

const Container = styled.div<{ isFullHeight?: boolean }>`
    background-color: inherit;
    box-sizing: border-box;
    border: ${Border.stroke.medium} solid transparent;
    border-radius: ${Border.radius.small};
    width: 100%;
    :hover,
    :focus-within {
        box-shadow: ${Shadows.light};
        background-color: ${Colors.background.white};
    }
    :hover {
        border-color: ${Colors.border.light};
    }
    :focus-within {
        border-color: ${Colors.gtColor.primary};
    }
    ${({ isFullHeight }) => (isFullHeight ? `height: 100%;` : '')}
`

const GTTextField = (props: GTTextFieldProps) => {
    const containerRef = useRef<HTMLDivElement>(null)

    const getEditor = () => {
        if (props.type === 'markdown') {
            return <MarkdownEditor {...props} />
        } else {
            return <PlainTextEditor {...props} />
        }
    }

    return (
        <Container ref={containerRef} onKeyDown={stopKeydownPropogation} isFullHeight={props.isFullHeight}>
            {getEditor()}
        </Container>
    )
}

export default GTTextField

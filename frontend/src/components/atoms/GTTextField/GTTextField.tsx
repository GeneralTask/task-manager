import { useRef } from 'react'
import styled from 'styled-components'
import { Border, Colors, Shadows, Spacing } from '../../../styles'
import { stopKeydownPropogation } from '../../../utils/utils'
import MarkdownEditor from './MarkdownEditor/MarkdownEditor'
import PlainTextEditor from './PlainTextEditor'
import { GTTextFieldProps } from './types'

const Container = styled.div<{ isFullHeight?: boolean; disabled?: boolean; maxHeight?: number }>`
    background-color: inherit;
    padding: ${Spacing._8};
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

const GTTextField = ({ onChange, value, type = 'plaintext', ...rest }: GTTextFieldProps) => {
    const containerRef = useRef<HTMLDivElement>(null)

    const Editor = type === 'markdown' ? MarkdownEditor : PlainTextEditor

    return (
        <Container ref={containerRef} onKeyDown={stopKeydownPropogation} isFullHeight={rest.isFullHeight}>
            <Editor value={value} onChange={onChange} {...rest} />
        </Container>
    )
}

export default GTTextField

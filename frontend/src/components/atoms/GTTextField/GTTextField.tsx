import { useRef } from 'react'
import styled from 'styled-components'
import { Border, Colors, Shadows } from '../../../styles'
import { stopKeydownPropogation } from '../../../utils/utils'
import MarkdownEditor from './MarkdownEditor/MarkdownEditor'
import PlainTextEditor from './PlainTextEditor'
import { GTTextFieldProps } from './types'

const PlainTextContainer = styled.div`
    border: ${Border.stroke.medium} solid transparent;
    border-radius: ${Border.radius.small};
    flex: 1;
    :focus-within {
        box-shadow: ${Shadows.light};
    }
    :hover {
        border-color: ${Colors.border.light};
    }
    :focus-within {
        border-color: ${Colors.gtColor.primary};
    }
`

const Container = styled.div<{ isFullHeight?: boolean; minHeight?: number }>`
    background-color: ${Colors.background.white};
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
    ${({ minHeight }) => (minHeight ? `min-height: ${minHeight}px;` : '')}
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

    if (props.type === 'plaintext') {
        return <PlainTextContainer onKeyDown={stopKeydownPropogation}>{getEditor()}</PlainTextContainer>
    }

    return (
        <Container
            ref={containerRef}
            onKeyDown={stopKeydownPropogation}
            isFullHeight={props.isFullHeight}
            minHeight={props.minHeight}
        >
            {getEditor()}
        </Container>
    )
}

export default GTTextField

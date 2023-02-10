import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import styled from 'styled-components'

const Container = styled.div`
    max-width: 100%;
    overflow: auto;
`

interface MarkdownRendererProps {
    children: string
}
const MarkdownRenderer = ({ children }: MarkdownRendererProps) => {
    return (
        <Container>
            <ReactMarkdown skipHtml={false} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw, rehypeSanitize]}>
                {children}
            </ReactMarkdown>
        </Container>
    )
}

export default MarkdownRenderer

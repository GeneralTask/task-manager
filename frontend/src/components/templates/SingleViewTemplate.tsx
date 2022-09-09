import styled from 'styled-components'

const SingleViewContainer = styled.div`
    width: 100vw;
    height: 100vh;
`

interface SingleViewTemplateProps {
    children: React.ReactNode
}
const SingleViewTemplate = ({ children }: SingleViewTemplateProps) => {
    return <SingleViewContainer>{children}</SingleViewContainer>
}

export default SingleViewTemplate

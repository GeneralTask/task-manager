interface SingleViewTemplateProps {
    children: JSX.Element
}
const SingleViewTemplate = ({ children }: SingleViewTemplateProps) => {
    return <div>{children}</div>
}

export default SingleViewTemplate

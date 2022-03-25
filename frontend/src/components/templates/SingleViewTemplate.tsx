import React from 'react'
import { View } from 'react-native'

interface SingleViewTemplateProps {
    children: JSX.Element
}
const SingleViewTemplate = ({ children }: SingleViewTemplateProps) => {
    return <View>{children}</View>
}

export default SingleViewTemplate

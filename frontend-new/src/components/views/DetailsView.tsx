import React from 'react'
import { Text } from 'react-native'
import styled from 'styled-components/native'
import { useGetTasksQuery } from '../../services/generalTaskApi'
import { useParams } from '../../services/routing'
import { Colors } from '../../styles'

const DetailsViewContainer = styled.View`
    display: flex;
    flex-direction: column;
    background-color: ${Colors.gray._50};
`

const DetailsView = () => {
    const params = useParams()
    const { data: taskSections } = useGetTasksQuery()
    const section = taskSections ? taskSections.find(section => section.id === params.section) : undefined
    const task = section ? section.tasks.find(task => task.id === params.task) : undefined

    return (
        task == null ? <></> : (
            <DetailsViewContainer>
                <Text>{task?.title}</Text>
                <Text>{task?.body}</Text>
            </DetailsViewContainer>
        )
    )
}

export default DetailsView

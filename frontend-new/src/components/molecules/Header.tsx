import React from 'react'
import { Platform } from 'react-native'
import styled from 'styled-components/native'
import { useDeleteTaskSectionMutation, useGetTasksQuery, useFetchTasksExternalQuery } from '../../services/generalTaskApi'
import { Typography, Spacing } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'

const SectionHeaderContainer = styled.View`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: ${Spacing.margin.medium}px;
`
const HeaderText = styled.Text`
    margin-right: ${Spacing.margin.small}px;
    font-size: ${Typography.xLarge.fontSize}px;
`
const TouchableIcon = styled.TouchableOpacity`
    margin-right: ${Spacing.margin.small}px;
`
interface SectionHeaderProps {
    section: string
    allowRefresh: boolean
    taskSectionId?: string
}
export const SectionHeader = (props: SectionHeaderProps) => {
    const [deleteTaskSection] = useDeleteTaskSectionMutation()
    const { refetch } = useGetTasksQuery()
    const fetchTasksExternalQuery = useFetchTasksExternalQuery()

    const tempSectionIds = [
        '000000000000000000000001',
        '000000000000000000000002',
        '000000000000000000000003',
        '000000000000000000000004',
    ]
    const matchTempSectionId = (id: string) => tempSectionIds.includes(id)

    const handleDelete = async (id: string | undefined) => {
        if (id) deleteTaskSection({ id: id })
    }
    return (
        <SectionHeaderContainer>
            <HeaderText>{props.section}</HeaderText>
            {props.allowRefresh && Platform.OS === 'web' &&
                <TouchableIcon onPress={async () => {
                    await fetchTasksExternalQuery.refetch()
                    await refetch()
                }}>
                    <Icon size={'small'} source={icons.spinner}></Icon>
                </TouchableIcon>
            }
            {
                props.taskSectionId != undefined && !matchTempSectionId(props.taskSectionId) &&
                <TouchableIcon onPress={() => handleDelete(props.taskSectionId)}>
                    <Icon size={'small'} source={icons.trash}></Icon>
                </TouchableIcon>
            }
        </SectionHeaderContainer >
    )
}

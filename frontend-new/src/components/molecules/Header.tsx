
import React, { useState } from 'react'
import { Spacing, Typography } from '../../styles'

import { Icon } from '../atoms/Icon'
import { Platform } from 'react-native'
import { icons } from '../../styles/images'
import styled from 'styled-components/native'
import { useDeleteTaskSectionMutation, useModifyTaskSectionMutation } from '../../services/generalTaskApi'
import { icons } from '../../styles/images'

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
const HeaderTextEditable = styled.TextInput`
    margin-right: ${Spacing.margin.small}px;
    font-size: ${Typography.xLarge.fontSize}px;
`
const TouchableIcon = styled.TouchableOpacity`
    margin-right: ${Spacing.margin.small}px;
`
interface SectionHeaderProps {
    sectionName: string
    allowRefresh: boolean
    refetch: () => void
    taskSectionId?: string
}
export const SectionHeader = (props: SectionHeaderProps) => {
    const [deleteTaskSection] = useDeleteTaskSectionMutation()
    const [modifyTaskSection] = useModifyTaskSectionMutation()
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [sectionName, setSectionName] = useState(props.sectionName)

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
    const handleChangeSectionName = async (id: string | undefined, name: string) => {
        if (id) modifyTaskSection({ id: id, name: name })
        setIsEditingTitle(false)
    }
    return (
        <SectionHeaderContainer>
            {isEditingTitle ? (
                <HeaderTextEditable
                    value={sectionName}
                    onChangeText={(val) => setSectionName(val)}
                    onBlur={() => handleChangeSectionName(props.taskSectionId, sectionName)}
                    autoFocus
                />
            ) : (
                <HeaderText>{props.sectionName}</HeaderText>
            )}
            {props.allowRefresh && Platform.OS === 'web' && (
                <TouchableIcon onPress={props.refetch}>
                    <Icon size={'small'} source={icons.spinner}></Icon>
                </TouchableIcon>
            )}
            {props.taskSectionId != undefined && !matchTempSectionId(props.taskSectionId) && (
                <>
                    <TouchableIcon onPress={() => handleDelete(props.taskSectionId)}>
                        <Icon size={'small'} source={icons['trash']}></Icon>
                    </TouchableIcon>
                    <TouchableIcon
                        onPress={() => {
                            setIsEditingTitle(true)
                        }}
                    >
                        <Icon size={'small'} source={icons['pencil']}></Icon>
                    </TouchableIcon>
                </>
            )}
        </SectionHeaderContainer>
    )
}

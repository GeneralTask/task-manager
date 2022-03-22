import React, { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import styled from 'styled-components/native'
import { useDeleteTaskSection, useModifyTaskSection } from '../../services/api-query-hooks'
import { Spacing, Typography } from '../../styles'
import { icons } from '../../styles/images'
import { Icon } from '../atoms/Icon'
import { InvisibleKeyboardShortcut } from '../atoms/KeyboardShortcuts'

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
    refetch?: () => void
    taskSectionId?: string
}
export const SectionHeader = (props: SectionHeaderProps) => {
    const { mutate: deleteTaskSection } = useDeleteTaskSection()
    const { mutate: modifyTaskSection } = useModifyTaskSection()
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [sectionName, setSectionName] = useState(props.sectionName)

    useEffect(() => {
        setSectionName(props.sectionName)
    }, [props.sectionName])

    const tempSectionIds = [
        '000000000000000000000001',
        '000000000000000000000002',
        '000000000000000000000003',
        '000000000000000000000004',
    ]
    const matchTempSectionId = (id: string) => tempSectionIds.includes(id)

    const handleDelete = async (id: string | undefined) => {
        if (id) deleteTaskSection({ sectionId: id })
    }
    const handleChangeSectionName = async (id: string | undefined, name: string) => {
        const trimmedName = name.trim()
        if (id && trimmedName.length > 0) {
            modifyTaskSection({ sectionId: id, name: trimmedName })
            setSectionName(trimmedName)
        } else {
            setSectionName(props.sectionName)
        }
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
                <HeaderText>{sectionName}</HeaderText>
            )}
            {props.allowRefresh && Platform.OS === 'web' && (
                <TouchableIcon onPress={props.refetch}>
                    <Icon size={'small'} source={icons.spinner}></Icon>
                    {Platform.OS === 'web' && props.refetch && (
                        <InvisibleKeyboardShortcut shortcut="r" onKeyPress={props.refetch} />
                    )}
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

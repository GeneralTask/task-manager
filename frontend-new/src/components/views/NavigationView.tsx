import { Colors, Flex } from '../../styles'
import { useDrop } from 'react-dnd'
import { ImageSourcePropType, Platform, Pressable, ScrollView, StyleSheet, Text, View, ViewStyle } from 'react-native'
import { ItemTypes, TTaskSection } from '../../utils/types'
import { Link, useLocation, useParams } from '../../services/routing'
import React, { CSSProperties, Ref, useCallback, useState } from 'react'
import {
    useAddTaskSectionMutation,
    useGetMessagesQuery,
    useGetTasksQuery,
    useReorderTaskMutation,
} from '../../services/generalTaskApi'

import { Icon } from '../atoms/Icon'
import Loading from '../atoms/Loading'
import WebInput from '../atoms/WebInput'
import { authSignOut } from '../../utils/auth'
import { icons } from '../../styles/images'
import styled from 'styled-components/native'
import { useAppDispatch } from '../../redux/hooks'
import { weight } from '../../styles/typography'

const NavigationViewHeader = styled.View`
    height: 24px;
    width: 100%;
    margin-bottom: 16px;
`
const SectionTitle = styled.Text<{ isSelected: boolean }>`
    font-weight: ${(props) => (props.isSelected ? weight._600.fontWeight : weight._500.fontWeight)};
    color: ${(props) => (props.isSelected ? Colors.gray._600 : Colors.gray._500)};
    margin-left: 9px;
`
const AddSectionView = styled.View`
    display: flex;
    flex-direction: row;
    padding-left: 8px;
    margin-top: 8px;
`
const AddSectionInputView = styled.View`
    margin-left: 8px;
    font-weight: ${weight._600.fontWeight};
`

const NavigationView = () => {
    const dispatch = useAppDispatch()
    const { data: taskSections, isLoading: isLoadingTasks } = useGetTasksQuery()
    const { isLoading: isLoadingMessages } = useGetMessagesQuery()
    const { section: sectionIdParam } = useParams()
    const [sectionName, setSectionName] = useState('')
    const [addTaskSection] = useAddTaskSectionMutation()
    const { pathname } = useLocation()

    const loading = isLoadingTasks || isLoadingMessages
    return (
        <View style={styles.container}>
            <NavigationViewHeader>
                <Icon size="medium" />
            </NavigationViewHeader>
            <ScrollView style={styles.linksFlexContainer}>
                {loading ? (
                    <Loading />
                ) : (
                    <>
                        {taskSections?.map((section, index) => (
                            <NavigationLink
                                key={index}
                                link={`/tasks/${section.id}`}
                                title={section.name}
                                icon={require('../../assets/inbox.png')}
                                isCurrentPage={sectionIdParam === section.id}
                                taskSection={section}
                            />
                        ))}
                        <NavigationLink
                            link="/messages"
                            title="Messages"
                            icon={require('../../assets/inbox.png')}
                            isCurrentPage={pathname === '/messages'}
                        />
                        <NavigationLink
                            link="/settings"
                            title="Settings"
                            icon={icons.gear}
                            isCurrentPage={pathname === '/settings'}
                        />
                    </>
                )}
                <AddSectionView>
                    <Icon size={'small'} source={require('../../assets/plus.png')} />
                    <AddSectionInputView>
                        <WebInput
                            value={sectionName}
                            onChange={(e) => setSectionName(e.target.value)}
                            placeholder={'Add Section'}
                            onSubmit={() => {
                                setSectionName('')
                                addTaskSection({ name: sectionName })
                            }}
                        />
                    </AddSectionInputView>
                </AddSectionView>
            </ScrollView>
            <Pressable onPress={() => authSignOut(dispatch)}>
                <Text>Sign Out</Text>
            </Pressable>
        </View>
    )
}

interface SectionProps {
    isCurrentPage: boolean
    link: string
    title: string
    icon: NodeRequire | ImageSourcePropType | undefined
    taskSection?: TTaskSection
}
const NavigationLink = ({ isCurrentPage, link, title, icon, taskSection }: SectionProps) => {
    const [reorderTask] = useReorderTaskMutation()

    const onDrop = useCallback((item: { id: string; taskIndex: number; sectionId: string }) => {
        if (taskSection) {
            reorderTask({
                taskId: item.id,
                orderingId: 1,
                dropSectionId: taskSection.id,
                dragSectionId: item.sectionId,
            })
        }
    }, [])

    const [isOver, drop] = useDrop(
        () => ({
            accept: ItemTypes.TASK,
            collect: (monitor) => {
                return !!(taskSection && monitor.isOver())
            },
            drop: onDrop,
            canDrop: () => !!taskSection,
        }),
        []
    )

    const dropRef = Platform.OS === 'web' ? (drop as Ref<View>) : undefined

    return (
        <Link style={linkStyle} to={link}>
            <View
                ref={dropRef}
                style={[
                    styles.linkContainer,
                    isCurrentPage ? styles.linkContainerSelected : null,
                    isOver ? styles.linkOnHover : null,
                ]}
            >
                <Icon size="small" source={icon} />
                <SectionTitle isSelected={isCurrentPage}>{title}</SectionTitle>
            </View>
        </Link>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Flex.column,
        minWidth: 232,
        backgroundColor: Colors.gray._100,
        paddingTop: 8,
    },
    linkContainer: {
        ...Flex.row,
        alignItems: 'center',
        height: 28,
        marginVertical: 4,
        marginHorizontal: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,

        borderRadius: 8,
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: 'transparent',
    },
    linkContainerSelected: {
        backgroundColor: Colors.gray._50,
    },
    linksFlexContainer: {
        flex: 1,
    },
    linkOnHover: {
        borderColor: Colors.gray._300,
    },
})

const linkStyle: CSSProperties & ViewStyle = {
    textDecorationLine: 'none',
    width: '100%',
}

export default NavigationView

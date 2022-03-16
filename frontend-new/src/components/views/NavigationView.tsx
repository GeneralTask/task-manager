import React, { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import styled from 'styled-components/native'
import { useAppDispatch } from '../../redux/hooks'
import { useAddTaskSectionMutation, useGetTasksQuery } from '../../services/generalTaskApi'
import { useLocation, useParams } from '../../services/routing'
import { Colors, Flex } from '../../styles'
import { icons } from '../../styles/images'
import { weight } from '../../styles/typography'
import { authSignOut } from '../../utils/auth'
import { Icon } from '../atoms/Icon'
import Loading from '../atoms/Loading'
import WebInput from '../atoms/WebInput'
import NavigationLink from '../molecules/NavigationLink'

const NavigationViewHeader = styled.View`
    height: 24px;
    width: 100%;
    margin-bottom: 16px;
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
    const { section: sectionIdParam } = useParams()
    const [sectionName, setSectionName] = useState('')
    const [addTaskSection] = useAddTaskSectionMutation()
    const { pathname } = useLocation()

    const loading = isLoadingTasks
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
                                icon={icons.inbox}
                                isCurrentPage={sectionIdParam === section.id}
                                taskSection={!section.is_done ? section : undefined}
                            />
                        ))}
                        <NavigationLink
                            link="/messages"
                            title="Messages"
                            icon={icons.inbox}
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

const styles = StyleSheet.create({
    container: {
        ...Flex.column,
        minWidth: 232,
        backgroundColor: Colors.gray._100,
        paddingTop: 8,
    },
    linksFlexContainer: {
        flex: 1,
    },
})

export default NavigationView

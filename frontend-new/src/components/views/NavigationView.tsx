import React, { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import styled from 'styled-components/native'
import { useAppDispatch } from '../../redux/hooks'
import { useAddTaskSectionMutation, useGetTasksQuery } from '../../services/generalTaskApi'
import { useLocation, useParams } from '../../services/routing'
import { Colors, Flex } from '../../styles'
import { icons } from '../../styles/images'
import { margin } from '../../styles/spacing'
import { weight } from '../../styles/typography'
import { authSignOut } from '../../utils/auth'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
import { Icon } from '../atoms/Icon'
import Loading from '../atoms/Loading'
import WebInput from '../atoms/WebInput'
import FeedbackButton from '../molecules/FeedbackButton'
import NavigationLink from '../molecules/NavigationLink'

const NavigationViewHeader = styled.View`
    height: 24px;
    width: 100%;
    margin-bottom: 16px;
`
const AddSectionView = styled.View`
    display: flex;
    flex-direction: row;
    margin: 4px 8px;
    padding: 4px 8px;
`
const AddSectionInputView = styled.View`
    font-weight: ${weight._600.fontWeight};
    margin-left: ${margin.small};
    flex: 1;
`

const NavigationView = () => {
    const dispatch = useAppDispatch()
    const { data: taskSections, isLoading: isLoadingTasks } = useGetTasksQuery()
    const { section: sectionIdParam } = useParams()
    const [sectionName, setSectionName] = useState('')
    const [addTaskSection] = useAddTaskSectionMutation()
    const { pathname } = useLocation()
    return (
        <View style={styles.container}>
            <NavigationViewHeader>
                <Icon size="medium" />
            </NavigationViewHeader>
            <ScrollView style={styles.linksFlexContainer}>
                {isLoadingTasks ? (
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
                                taskSection={section}
                                droppable={!section.is_done}
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
                    <Icon size={'small'} source={icons['plus']} />
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
            <FeedbackButton />
            <RoundedGeneralButton value="Sign Out" textStyle="dark" onPress={() => authSignOut(dispatch)} />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        ...Flex.column,
        width: 232,
        backgroundColor: Colors.gray._100,
        paddingLeft: 8,
        paddingTop: 8,
        paddingRight: 8,
    },
    linkContainerSelected: {
        backgroundColor: Colors.gray._50,
    },
    linksFlexContainer: {
        flex: 1,
    },
})

export default NavigationView

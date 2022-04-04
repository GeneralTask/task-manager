import { Colors, Flex } from '../../styles'
import React, { useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { margin, padding } from '../../styles/spacing'
import { useAddTaskSection, useGetTasks } from '../../services/api-query-hooks'
import { useLocation, useParams } from 'react-router-dom'

import FeedbackButton from '../molecules/FeedbackButton'
import { Icon } from '../atoms/Icon'
import Loading from '../atoms/Loading'
import NavigationSectionLinks from '../navigation_sidebar/NavigationSectionLinks'
import RoundedGeneralButton from '../atoms/buttons/RoundedGeneralButton'
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
const AddSectionView = styled.View`
    display: flex;
    flex-direction: row;
    margin: 4px 8px;
    padding: 4px 8px;
`
const AddSectionInputView = styled.View`
    font-weight: ${weight._600.fontWeight};
    margin-left: ${margin._8}px;
    flex: 1;
`
const GapView = styled.View`
    display: flex;
    flex-direction: column;
    gap: ${margin._8}px;
    padding-bottom: ${padding._16}px;
`

const NavigationView = () => {
    const dispatch = useAppDispatch()
    const { data: taskSections, isLoading } = useGetTasks()
    const { section: sectionIdParam } = useParams()
    const [sectionName, setSectionName] = useState('')
    const { mutate: addTaskSection } = useAddTaskSection()
    const { pathname } = useLocation()

    const showLoadingSections = isLoading || !taskSections

    return (
        <View style={styles.container}>
            <NavigationViewHeader>
                <Icon size="medium" />
            </NavigationViewHeader>
            <ScrollView style={styles.linksFlexContainer}>
                {showLoadingSections ? <Loading /> :
                    <NavigationSectionLinks taskSections={taskSections} sectionId={sectionIdParam || ''} pathName={pathname} />
                }
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
            <GapView>
                <FeedbackButton />
                <RoundedGeneralButton value="Sign Out" textStyle="dark" onPress={() => authSignOut(dispatch)} />
            </GapView>
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

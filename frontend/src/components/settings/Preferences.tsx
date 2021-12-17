import React, { useCallback } from 'react'
import { TSetting, TSettingChoice } from '../../helpers/types'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { SETTINGS_URL } from '../../constants'
import { makeAuthorizedRequest } from '../../helpers/utils'
import { setSettings } from '../../redux/settingsSlice'
import styled from 'styled-components'
import { useEffect } from 'react'

const PreferencesContainer = styled.div`
    display: flex;
    flex-direction: column;
`
const PreferencesHeaderText = styled.div`
	font-size: 1.5em; 
	font-weight: bold;
	min-width: 330px;
`
const PreferenceContainer = styled.div`
    margin: 20px 0px 0px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 18px;
`
const PreferenceText = styled.div`
    min-width: 300px;
`
const Select = styled.select`
    height: 30px;
    display: flex;
    align-items: center;
    padding: 0 4px;
    border: 2px solid black;
    border-radius: 4px;
    min-width: 140px;
`

interface Props {
    setting: TSetting,
    fetchSettings: () => void,
}

export const useFetchSettings = (): () => Promise<void> => {
    const dispatch = useAppDispatch()
    return useCallback(async () => {
        const response = await makeAuthorizedRequest({
            url: SETTINGS_URL,
            method: 'GET',
        })
        if (response.ok) {
            const settings = await response.json()
            dispatch(setSettings(settings))
        }
    }, [dispatch])
}

const Preferences: React.FC = () => {
    const settings = useAppSelector((state) => state.settings_page.settings)
    const fetchSettings = useFetchSettings()
    useEffect(() => {
        fetchSettings()
    }, [])
    if (settings.length === 0) return (null)
    return (
        <PreferencesContainer>
            <PreferencesHeaderText>Preferences</PreferencesHeaderText>
            {
                settings.map((setting: TSetting) =>
                    <Preference setting={setting} key={setting.field_key} fetchSettings={fetchSettings} />
                )
            }
        </PreferencesContainer>
    )
}

const Preference: React.FC<Props> = ({ setting, fetchSettings }: Props) => {
    const selectOnChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        await changeSetting(setting.field_key, e.target.value)
        fetchSettings()
    }
    return (
        <PreferenceContainer>
            <PreferenceText>{setting.field_name}</PreferenceText>
            <Select onChange={selectOnChange} defaultValue={setting.field_value}>
                {
                    setting.choices.map((choice: TSettingChoice) =>
                        <option value={choice.choice_key} key={choice.choice_key}>{choice.choice_name}</option>
                    )
                }
            </Select>
        </PreferenceContainer>
    )
}

const changeSetting = async (field_key: string, choice_key: string) => {
    await makeAuthorizedRequest({
        url: SETTINGS_URL,
        method: 'PATCH',
        body: `{"${field_key}":"${choice_key}"}`,
    })
}

export default Preferences

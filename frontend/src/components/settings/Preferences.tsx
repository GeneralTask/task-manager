import React, { useCallback } from 'react'
import { TSetting, TSettingChoice } from '../../helpers/types'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'

import { SETTINGS_URL } from '../../constants'
import { makeAuthorizedRequest } from '../../helpers/utils'
import { setSettings } from '../../redux/settingsSlice'
import styled from 'styled-components'
import { useEffect } from 'react'

const PreferenceDiv = styled.div`
  margin: auto;
  width: 90%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  margin-bottom: 30px;
`

const Select = styled.select`
    height: 30px;
    display: flex;
    align-items: center;
    padding: 0 4px 0 4px;
    border: 2px solid black;
    border-radius: 4px;
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
    return (
        <div>
            {settings.length ? <h2>Preferences</h2> : null}
            {settings.map((setting: TSetting, index: number) =>
                <Preference setting={setting} key={index} fetchSettings={fetchSettings} />)
            }
        </div>
    )
}

const Preference: React.FC<Props> = ({ setting, fetchSettings }: Props) => {
    return (
        <PreferenceDiv>
            <div>{setting.field_name}</div>
            <Select onChange={async (e) => {
                await changeSetting(setting.field_key, e.target.value)
                await fetchSettings()
            }} defaultValue={setting.field_value}>
                {setting.choices.map((choice: TSettingChoice, i) =>
                    <option value={choice.choice_key} key={i}>{choice.choice_name}</option>
                )}
            </Select>
        </PreferenceDiv>
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

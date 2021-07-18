import React from 'react'
import { useEffect } from 'react'
import { connect, useSelector } from 'react-redux'
import styled from 'styled-components'
import { SETTINGS_URL } from '../../constants'
import { TSetting, TSettingChoice } from '../../helpers/types'
import { makeAuthorizedRequest } from '../../helpers/utils'
import { setSettings } from '../../redux/actions'
import store, { RootState } from '../../redux/store'

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
    setting: TSetting
}

const fetchSettings = async () => {
    const response = await makeAuthorizedRequest({
        url: SETTINGS_URL,
        method: 'GET',
    })
    if (response.ok) {
        const settings = await response.json()
        store.dispatch(setSettings(settings))
    }
}

const Preferences: React.FC = () => {
    const settings = useSelector((state: RootState) => state.settings)
    useEffect(() => {
        fetchSettings()
    }, [])
    return (
        <div>
            {settings.length ? <h2>Preferences</h2> : null}
            {settings.map((setting: TSetting, index: number) => <Preference setting={setting} key={index} />)}
        </div>
    )
}

const Preference: React.FC<Props> = ({ setting }: Props) => {
    return (
        <PreferenceDiv>
            <div>{setting.field_name}</div>
            <Select onChange={(e) => { changeSetting(setting.field_key, e.target.value) }} defaultValue={setting.field_value}>
                {setting.choices.map((choice: TSettingChoice, i) =>
                    <option value={choice.choice_key} key={i}>{choice.choice_name}</option>
                )}
            </Select>
        </PreferenceDiv>
    )
}

const changeSetting = (field_key: string, choice_key: string) => {
    makeAuthorizedRequest({
        url: SETTINGS_URL,
        method: 'PATCH',
        body: `{"${field_key}":"${choice_key}"}`,
    })
}

export default connect(
    (state: RootState) => ({ settings: state.settings })
)(Preferences)

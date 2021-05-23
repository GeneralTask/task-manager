import React, { useState } from 'react'
import { useEffect } from 'react'
import { connect, useSelector } from 'react-redux'
import styled from 'styled-components'
import { SETTINGS_URL } from '../../constants'
import { TSetting, TSettingChoice } from '../../helpers/types'
import { getHeaders } from '../../helpers/utils'
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
`

interface Props {
    setting: TSetting
}

const fetchSettings = async () => {
    const response: Response = await fetch(SETTINGS_URL, {
        method: 'GET',
        mode: 'cors',
        headers: getHeaders(),
    })
    if(!response.ok){
        throw new Error('/tasks api call failed')
    }
    else{
        const settings = await response.json()
        store.dispatch(setSettings(settings))
        // store.dispatch(setTasksFetchStatus(FetchStatus.SUCCESS))
        // store.dispatch(setTasks(resj))
    }
}

const Preferences: React.FC = () => {
    const settings = useSelector((state: RootState) => state.settings)
    useEffect(()=>{
        fetchSettings()
    }, [])
    return (
        <div>
            {settings.length ? <h2>Preferences</h2> : null}
            {settings.map((setting: TSetting, index: number) => <Preference setting={setting} key={index}/>)}
        </div>
    )
}

const Preference: React.FC<Props> = ({setting}: Props) => {
    return (
        <PreferenceDiv>
            <div>{setting.field_name}</div>
            <Select onChange={(e) => {changeSetting(setting.field_key, e.target.value)}}>
                {setting.choices.map((choice: TSettingChoice) => 
                    <option value={choice.choice_key} selected={!!(setting.field_value === choice.choice_key)}>{choice.choice_name}</option>
                )}
            </Select>
        </PreferenceDiv>
    )
}

const changeSetting = (field_key: string, choice_key: string) => {
    fetch(SETTINGS_URL, {
        method: 'PATCH',
        mode: 'cors',
        headers: getHeaders(),
        body: `{"${field_key}":"${choice_key}"}`
    })
}

export default connect(
    (state: RootState) => ({settings: state.settings})
)(Preferences)

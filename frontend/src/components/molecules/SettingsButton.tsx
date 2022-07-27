import React from 'react'
import GTButton from '../atoms/buttons/GTButton'
import { useNavigate } from 'react-router-dom'

const SettingsButton = () => {
    const navigate = useNavigate()

    return <GTButton value="Settings" styleType="secondary" onClick={() => navigate('/settings')} />
}

export default SettingsButton

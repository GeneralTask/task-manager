import { useMemo } from 'react'
import { TSettingsKey, useGetSettings, useUpdateSetting } from '../services/api/settings.hooks'
import { TSetting } from '../utils/types'
import { emptyFunction } from '../utils/utils'

export type TSettingValue = string | number | boolean
interface SettingResult extends TSetting {
    isLoading: boolean
    updateSetting: (value: TSettingValue) => void
}
const useSetting = (settingKey: TSettingsKey): SettingResult => {
    const { data, isLoading } = useGetSettings()
    const { mutate } = useUpdateSetting()

    return useMemo(() => {
        const setting = data?.find((setting) => setting.field_key === settingKey) ?? data?.[0]

        if (isLoading || !data || !setting) {
            return {
                isLoading: true,
                field_key: settingKey,
                field_value: '',
                field_name: '',
                choices: [],
                updateSetting: emptyFunction,
            }
        }

        const updateSetting = (value: TSettingValue) => {
            mutate({ key: settingKey, value: String(value) })
        }

        return {
            ...setting,
            isLoading: false,
            updateSetting,
        }
    }, [data, isLoading, settingKey, mutate])
}

export default useSetting

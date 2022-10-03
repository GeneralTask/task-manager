export type FontSize = 'small' | 'medium' | 'large'

export interface GTTextFieldProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    initialValue: string
    onChange: (newValue: string) => void
    fontSize: FontSize
    type?: 'plaintext' | 'markdown'
    maxHeight?: number
    isFullHeight?: boolean
    blurOnEnter?: boolean
    autoSelect?: boolean
}

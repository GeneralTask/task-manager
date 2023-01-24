export type FontSize = 'small' | 'medium' | 'large'
export type ContentType = 'markdown' | 'atlassian' | 'plaintext'

// props we support for markdown
export interface RichTextEditorProps {
    value: string
    onChange: (newValue: string) => void
    placeholder?: string
    fontSize: FontSize
    type: 'markdown' | 'atlassian'
    autoFocus?: boolean
    autoSelect?: boolean
    enterBehavior?: 'blur' | 'disable'
    disabled?: boolean
    readOnly?: boolean
    isFullHeight?: boolean
    maxHeight?: number
    minHeight?: number
    hideUnfocusedOutline?: boolean
    keyDownExceptions?: string[]
    actions?: React.ReactNode | React.ReactNode[]
}

// all props we support for markdown + native textarea props
export interface PlainTextEditorProps
    extends Omit<RichTextEditorProps, 'type'>,
        Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
    type: 'plaintext'
}

export type GTTextFieldProps = RichTextEditorProps | PlainTextEditorProps

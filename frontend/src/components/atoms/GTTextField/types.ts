export type FontSize = 'small' | 'medium' | 'large'

// props we support for markdown
export interface GTMarkdownEditorProps {
    value: string
    onChange: (newValue: string) => void
    placeholder?: string
    fontSize: FontSize
    type: 'markdown'
    itemId?: string // use if reusing field for multiple items
    autoFocus?: boolean
    autoSelect?: boolean
    blurOnEnter?: boolean
    disabled?: boolean
    isFullHeight?: boolean
    maxHeight?: number
}

// all props we support for markdown + native textarea props
export interface GTPlainTextEditorProps
    extends Omit<GTMarkdownEditorProps, 'type'>,
        Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
    type: 'plaintext'
}

export type GTTextFieldProps = GTMarkdownEditorProps | GTPlainTextEditorProps

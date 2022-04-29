import { EmailComposeType } from "../../../utils/enums"

const prefixes = ['Re: ', 'Fwd: ', 'Fw: ']

export function stripSubjectPrefix(subject: string): string {
    for (const prefix of prefixes) {
        if (subject.startsWith(prefix)) {
            return subject.substring(prefix.length)
        }
    }
    return subject
}

export function attachSubjectPrefix(subject: string, composeType: EmailComposeType | null): string {
    const prefix = composeType ?? ''
    return prefix + subject
}

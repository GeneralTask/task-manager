// https://github.com/julianlam/adf-to-md
declare module 'adf-to-md' {
    function convert(adf: object): {
        result: string
        warnings: string[]
    }
}

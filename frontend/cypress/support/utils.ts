export const hexToRGBString = (hex: string) => {
    const parsed = parseInt(hex.substring(1, hex.length), 16)
    return `rgb(${parsed >> 16}, ${parsed >> 8 & 0xFF}, ${parsed & 0xFF})`
}

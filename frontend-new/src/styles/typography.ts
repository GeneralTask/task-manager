import { Platform } from "react-native";

export const fontSize = {
    header: Platform.OS === "web" ? 58 : 33,
    subheader: Platform.OS === "web" ? 27 : 16,
}

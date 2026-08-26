import { StyleSheet, View } from "react-native"

const styles = StyleSheet.create({
  glow: {
    bottom: 64,
    borderRadius: 220,
    boxShadow: "0 0 140px rgba(49, 159, 93, 0.32)",
    height: 440,
    left: -240,
    position: "absolute",
    width: 440,
  },
})

export function ScreenGlow() {
  return (
    <View className="bg-primary/15" pointerEvents="none" style={styles.glow} />
  )
}

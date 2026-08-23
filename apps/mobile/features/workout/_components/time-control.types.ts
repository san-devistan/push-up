export type TimeControlProps = {
  value: {
    hour: number
    minute: number
  }
  onChange: (hour: number, minute: number) => void
}

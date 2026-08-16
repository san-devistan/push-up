import {
  ReanimatedLogLevel,
  configureReanimatedLogger,
} from "react-native-reanimated"

export function configureMobileReanimatedLogger() {
  configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
  })
}

import {
  configurePurchases,
  hasProEntitlement,
  isBillingConfigured,
} from "@/features/billing/_lib/purchases"
import { authClient, isAuthConfigured } from "@/lib/auth-client"
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import Purchases, { type CustomerInfo } from "react-native-purchases"

type ProState = {
  /** `true` until the first customer info arrives from cache or network. */
  isLoading: boolean
  /** Whether the current customer holds the `pro` entitlement. */
  isPro: boolean
}

const OPEN_STATE: ProState = { isLoading: false, isPro: true }
const LOADING_STATE: ProState = { isLoading: true, isPro: false }
const ProContext = createContext<ProState>(OPEN_STATE)

function stateFromInfo(info: CustomerInfo): ProState {
  return { isLoading: false, isPro: hasProEntitlement(info) }
}

/**
 * Keeps the RevenueCat customer identified as the Better Auth user so a
 * subscription follows the account across devices and sign-ins.
 */
function useIdentifyCustomer() {
  const { data: session } = authClient.useSession()
  const userId = isAuthConfigured ? session?.user.id : undefined

  useEffect(() => {
    if (!userId) {
      return undefined
    }

    let cancelled = false

    async function identify(id: string) {
      const currentId = await Purchases.getAppUserID()

      if (!cancelled && currentId !== id) {
        await Purchases.logIn(id)
      }
    }

    identify(userId).catch(() => undefined)

    return () => {
      cancelled = true
    }
  }, [userId])
}

function ProSync({ onChange }: { onChange: (state: ProState) => void }) {
  useIdentifyCustomer()

  useEffect(() => {
    const listener = (info: CustomerInfo) => onChange(stateFromInfo(info))

    Purchases.addCustomerInfoUpdateListener(listener)
    void Purchases.getCustomerInfo()
      .then(listener)
      .catch(() => onChange({ isLoading: false, isPro: false }))

    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener)
    }
  }, [onChange])

  return null
}

export function ProProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProState>(
    isBillingConfigured ? LOADING_STATE : OPEN_STATE
  )

  if (!isBillingConfigured) {
    return children
  }

  configurePurchases()

  return (
    <ProContext.Provider value={state}>
      <ProSync onChange={setState} />
      {children}
    </ProContext.Provider>
  )
}

export function usePro() {
  return useContext(ProContext)
}

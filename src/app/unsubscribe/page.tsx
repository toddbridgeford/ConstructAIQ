import { Suspense }    from "react"
import UnsubscribeForm from "./UnsubscribeForm"

export const metadata = { title: "Unsubscribe — ConstructAIQ" }

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#000" }} />}>
      <UnsubscribeForm />
    </Suspense>
  )
}

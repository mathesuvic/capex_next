// app/page.tsx
import { redirect } from "next/navigation"

export default function RootRedirect() {
  // sempre que acessar "/", vai para /login
  redirect("/home")
}

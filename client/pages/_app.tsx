import type { AppProps } from 'next/app'
import { ThemeProvider } from "@/contexts/theme-context"
import { AuthProvider } from "@/contexts/auth-context"
import { SidebarProvider } from "@/components/ui/sidebar"
import "@/app/globals.css"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <Component {...pageProps} />
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

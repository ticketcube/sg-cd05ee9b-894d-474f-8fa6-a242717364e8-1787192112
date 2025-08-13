
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import AuthProvider from "@/contexts/AuthContext";
import { CubeProvider } from "@/contexts/CubeContext";
import { Toaster } from "@/components/ui/toaster";
import { Layout } from '@/components/layout/Layout'


export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
          <CubeProvider>
              <Layout>
                  <Component {...pageProps} />
                  </Layout>
        <Toaster />
      </CubeProvider>
    </AuthProvider>
  );
}

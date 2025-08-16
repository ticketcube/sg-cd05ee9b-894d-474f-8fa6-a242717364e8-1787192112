
import type { AppProps } from "next/app";
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import AuthProvider from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import AppLayout from "@/components/layout/AppLayout";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <AppLayout>
        <Component {...pageProps} />
      </AppLayout>
      <Toaster />
    </AuthProvider>
  );
}
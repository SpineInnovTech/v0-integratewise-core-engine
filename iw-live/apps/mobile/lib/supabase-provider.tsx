/**
 * Supabase Provider for React Native
 *
 * Sets up Supabase with secure storage and provides context.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { createNativeClient, type SupabaseClient } from "@integratewise/supabase/native";
import Constants from "expo-constants";

const SupabaseContext = createContext<SupabaseClient | null>(null);

const supabaseUrl =
  Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [client, setClient] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase configuration");
      return;
    }

    const supabase = createNativeClient({
      supabaseUrl,
      supabaseAnonKey,
      storage: {
        getItem: async (key: string) => {
          return SecureStore.getItemAsync(key);
        },
        setItem: async (key: string, value: string) => {
          await SecureStore.setItemAsync(key, value);
        },
        removeItem: async (key: string) => {
          await SecureStore.deleteItemAsync(key);
        },
      },
    });

    setClient(supabase);
  }, []);

  if (!client) {
    return null; // Or a loading screen
  }

  return <SupabaseContext.Provider value={client}>{children}</SupabaseContext.Provider>;
}

export function useSupabase(): SupabaseClient {
  const client = useContext(SupabaseContext);
  if (!client) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return client;
}

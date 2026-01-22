export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      cnh_alerts: {
        Row: {
          alert_type: string
          cnh_expiry: string
          id: string
          read_at: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          cnh_expiry: string
          id?: string
          read_at?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          cnh_expiry?: string
          id?: string
          read_at?: string | null
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          deposit: number | null
          driver_id: string
          end_date: string | null
          excess_km_fee: number | null
          id: string
          km_limit: number | null
          locador_id: string
          payment_day: string
          start_date: string
          status: string
          terms: string | null
          updated_at: string
          vehicle_id: string
          weekly_price: number
        }
        Insert: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          deposit?: number | null
          driver_id: string
          end_date?: string | null
          excess_km_fee?: number | null
          id?: string
          km_limit?: number | null
          locador_id: string
          payment_day?: string
          start_date: string
          status?: string
          terms?: string | null
          updated_at?: string
          vehicle_id: string
          weekly_price: number
        }
        Update: {
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          deposit?: number | null
          driver_id?: string
          end_date?: string | null
          excess_km_fee?: number | null
          id?: string
          km_limit?: number | null
          locador_id?: string
          payment_day?: string
          start_date?: string
          status?: string
          terms?: string | null
          updated_at?: string
          vehicle_id?: string
          weekly_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_requests: {
        Row: {
          created_at: string
          description: string | null
          document_id: string | null
          driver_id: string
          expires_at: string | null
          file_path: string
          file_size: number | null
          id: string
          locador_id: string
          mime_type: string | null
          name: string
          rejection_reason: string | null
          reviewed_at: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_id?: string | null
          driver_id: string
          expires_at?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          locador_id: string
          mime_type?: string | null
          name: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_id?: string | null
          driver_id?: string
          expires_at?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          locador_id?: string
          mime_type?: string | null
          name?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_requests_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          contract_id: string | null
          created_at: string
          description: string | null
          driver_id: string | null
          expires_at: string | null
          file_path: string
          file_size: number | null
          id: string
          locador_id: string
          mime_type: string | null
          name: string
          type: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          description?: string | null
          driver_id?: string | null
          expires_at?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          locador_id: string
          mime_type?: string | null
          name: string
          type: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          description?: string | null
          driver_id?: string | null
          expires_at?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          locador_id?: string
          mime_type?: string | null
          name?: string
          type?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          cnh_expiry: string
          cnh_number: string
          created_at: string
          email: string
          id: string
          locador_id: string
          name: string
          phone: string | null
          status: string
          updated_at: string
          user_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          cnh_expiry: string
          cnh_number: string
          created_at?: string
          email: string
          id?: string
          locador_id: string
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          cnh_expiry?: string
          cnh_number?: string
          created_at?: string
          email?: string
          id?: string
          locador_id?: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenances: {
        Row: {
          cost: number | null
          created_at: string
          description: string
          id: string
          km_at_maintenance: number | null
          locador_id: string
          next_maintenance_date: string | null
          next_maintenance_km: number | null
          notes: string | null
          performed_at: string
          service_provider: string | null
          status: string
          type: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          description: string
          id?: string
          km_at_maintenance?: number | null
          locador_id: string
          next_maintenance_date?: string | null
          next_maintenance_km?: number | null
          notes?: string | null
          performed_at: string
          service_provider?: string | null
          status?: string
          type: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          description?: string
          id?: string
          km_at_maintenance?: number | null
          locador_id?: string
          next_maintenance_date?: string | null
          next_maintenance_km?: number | null
          notes?: string | null
          performed_at?: string
          service_provider?: string | null
          status?: string
          type?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenances_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      mileage_records: {
        Row: {
          contract_id: string | null
          created_at: string
          driver_id: string
          id: string
          km_reading: number
          locador_id: string
          notes: string | null
          recorded_at: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          driver_id: string
          id?: string
          km_reading: number
          locador_id: string
          notes?: string | null
          recorded_at?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          driver_id?: string
          id?: string
          km_reading?: number
          locador_id?: string
          notes?: string | null
          recorded_at?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mileage_records_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_records_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mileage_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          contract_id: string | null
          created_at: string
          driver_id: string
          due_date: string
          id: string
          locador_id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          reference_week: string
          status: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          amount: number
          contract_id?: string | null
          created_at?: string
          driver_id: string
          due_date: string
          id?: string
          locador_id: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          reference_week: string
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          contract_id?: string | null
          created_at?: string
          driver_id?: string
          due_date?: string
          id?: string
          locador_id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          reference_week?: string
          status?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cnh_expiry: string | null
          cnh_number: string | null
          created_at: string
          document_number: string | null
          document_type: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cnh_expiry?: string | null
          cnh_number?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cnh_expiry?: string | null
          cnh_number?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          allowed_apps: string[] | null
          brand: string
          city: string
          color: string
          created_at: string
          current_driver_id: string | null
          current_km: number | null
          deposit: number | null
          description: string | null
          excess_km_fee: number | null
          fuel_type: string
          id: string
          images: string[] | null
          km_limit: number | null
          locador_id: string
          model: string
          plate: string
          state: string
          status: string
          updated_at: string
          weekly_price: number
          year: number
        }
        Insert: {
          allowed_apps?: string[] | null
          brand: string
          city: string
          color: string
          created_at?: string
          current_driver_id?: string | null
          current_km?: number | null
          deposit?: number | null
          description?: string | null
          excess_km_fee?: number | null
          fuel_type: string
          id?: string
          images?: string[] | null
          km_limit?: number | null
          locador_id: string
          model: string
          plate: string
          state: string
          status?: string
          updated_at?: string
          weekly_price: number
          year: number
        }
        Update: {
          allowed_apps?: string[] | null
          brand?: string
          city?: string
          color?: string
          created_at?: string
          current_driver_id?: string | null
          current_km?: number | null
          deposit?: number | null
          description?: string | null
          excess_km_fee?: number | null
          fuel_type?: string
          id?: string
          images?: string[] | null
          km_limit?: number | null
          locador_id?: string
          model?: string
          plate?: string
          state?: string
          status?: string
          updated_at?: string
          weekly_price?: number
          year?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_cnh_alert: {
        Args: { _alert_type: string; _cnh_expiry: string; _user_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "locador" | "motorista"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "locador", "motorista"],
    },
  },
} as const

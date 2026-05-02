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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      developer_logs: {
        Row: {
          acao: string
          created_at: string
          empresa_id: string
          entidade: string | null
          entidade_id: string | null
          id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          acao: string
          created_at?: string
          empresa_id: string
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          acao?: string
          created_at?: string
          empresa_id?: string
          entidade?: string | null
          entidade_id?: string | null
          id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "developer_logs_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      execucao_etapas: {
        Row: {
          concluido: boolean
          created_at: string
          data_fim: string | null
          data_inicio: string | null
          empresa_id: string
          etapa_id: string
          execucao_id: string
          id: string
          tempo_gasto_segundos: number | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          concluido?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          empresa_id: string
          etapa_id: string
          execucao_id: string
          id?: string
          tempo_gasto_segundos?: number | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          concluido?: boolean
          created_at?: string
          data_fim?: string | null
          data_inicio?: string | null
          empresa_id?: string
          etapa_id?: string
          execucao_id?: string
          id?: string
          tempo_gasto_segundos?: number | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execucao_etapas_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "pop_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execucao_etapas_execucao_id_fkey"
            columns: ["execucao_id"]
            isOneToOne: false
            referencedRelation: "execucoes"
            referencedColumns: ["id"]
          },
        ]
      }
      execucoes: {
        Row: {
          created_at: string
          data_fim: string | null
          data_inicio: string
          empresa_id: string
          id: string
          pop_id: string
          pop_versao_id: string
          status: string
          tempo_total_segundos: number | null
          updated_at: string
          usuario_id: string
        }
        Insert: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          empresa_id: string
          id?: string
          pop_id: string
          pop_versao_id: string
          status?: string
          tempo_total_segundos?: number | null
          updated_at?: string
          usuario_id: string
        }
        Update: {
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          empresa_id?: string
          id?: string
          pop_id?: string
          pop_versao_id?: string
          status?: string
          tempo_total_segundos?: number | null
          updated_at?: string
          usuario_id?: string
        }
        Relationships: []
      }
      pop_etapas: {
        Row: {
          checklist: Json
          created_at: string
          descricao: string
          empresa_id: string
          erro_comum: string
          id: string
          ordem: number
          pop_versao_id: string
          pre_requisito: string
          resultado_esperado: string
          tempo_estimado: string
          titulo: string
          updated_at: string
        }
        Insert: {
          checklist?: Json
          created_at?: string
          descricao?: string
          empresa_id: string
          erro_comum?: string
          id?: string
          ordem: number
          pop_versao_id: string
          pre_requisito?: string
          resultado_esperado?: string
          tempo_estimado?: string
          titulo?: string
          updated_at?: string
        }
        Update: {
          checklist?: Json
          created_at?: string
          descricao?: string
          empresa_id?: string
          erro_comum?: string
          id?: string
          ordem?: number
          pop_versao_id?: string
          pre_requisito?: string
          resultado_esperado?: string
          tempo_estimado?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pop_etapas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pop_etapas_pop_versao_id_fkey"
            columns: ["pop_versao_id"]
            isOneToOne: false
            referencedRelation: "pop_versoes"
            referencedColumns: ["id"]
          },
        ]
      }
      pop_midias: {
        Row: {
          created_at: string
          empresa_id: string
          etapa_id: string | null
          id: string
          nome: string
          ordem: number
          pop_versao_id: string
          referencia: string
          tipo: Database["public"]["Enums"]["pop_midia_tipo"]
          url: string | null
        }
        Insert: {
          created_at?: string
          empresa_id: string
          etapa_id?: string | null
          id?: string
          nome?: string
          ordem?: number
          pop_versao_id: string
          referencia: string
          tipo: Database["public"]["Enums"]["pop_midia_tipo"]
          url?: string | null
        }
        Update: {
          created_at?: string
          empresa_id?: string
          etapa_id?: string | null
          id?: string
          nome?: string
          ordem?: number
          pop_versao_id?: string
          referencia?: string
          tipo?: Database["public"]["Enums"]["pop_midia_tipo"]
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pop_midias_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pop_midias_etapa_id_fkey"
            columns: ["etapa_id"]
            isOneToOne: false
            referencedRelation: "pop_etapas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pop_midias_pop_versao_id_fkey"
            columns: ["pop_versao_id"]
            isOneToOne: false
            referencedRelation: "pop_versoes"
            referencedColumns: ["id"]
          },
        ]
      }
      pop_versoes: {
        Row: {
          created_at: string
          created_by: string
          descricao_mudanca: string | null
          empresa_id: string
          id: string
          numero: string
          pop_id: string
          status: Database["public"]["Enums"]["pop_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          descricao_mudanca?: string | null
          empresa_id: string
          id?: string
          numero?: string
          pop_id: string
          status?: Database["public"]["Enums"]["pop_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          descricao_mudanca?: string | null
          empresa_id?: string
          id?: string
          numero?: string
          pop_id?: string
          status?: Database["public"]["Enums"]["pop_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pop_versoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pop_versoes_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pop_versoes_pop_id_fkey"
            columns: ["pop_id"]
            isOneToOne: false
            referencedRelation: "pops"
            referencedColumns: ["id"]
          },
        ]
      }
      pops: {
        Row: {
          created_at: string
          departamento: string
          descricao: string
          empresa_id: string
          id: string
          owner_id: string
          responsavel: string
          titulo: string
          updated_at: string
          versao_ativa_id: string | null
          visibilidade: Database["public"]["Enums"]["pop_visibilidade"]
        }
        Insert: {
          created_at?: string
          departamento?: string
          descricao?: string
          empresa_id: string
          id?: string
          owner_id: string
          responsavel?: string
          titulo: string
          updated_at?: string
          versao_ativa_id?: string | null
          visibilidade?: Database["public"]["Enums"]["pop_visibilidade"]
        }
        Update: {
          created_at?: string
          departamento?: string
          descricao?: string
          empresa_id?: string
          id?: string
          owner_id?: string
          responsavel?: string
          titulo?: string
          updated_at?: string
          versao_ativa_id?: string | null
          visibilidade?: Database["public"]["Enums"]["pop_visibilidade"]
        }
        Relationships: [
          {
            foreignKeyName: "pops_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pops_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pops_versao_ativa_fk"
            columns: ["versao_ativa_id"]
            isOneToOne: false
            referencedRelation: "pop_versoes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_context: {
        Row: {
          empresa_ativa_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          empresa_ativa_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          empresa_ativa_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_context_empresa_ativa_id_fkey"
            columns: ["empresa_ativa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_context_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          created_at: string
          email: string
          empresa_id: string
          id: string
          nome: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          email: string
          empresa_id: string
          id: string
          nome: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          email?: string
          empresa_id?: string
          id?: string
          nome?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_empresa_id: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "gestor" | "criador" | "executor" | "developer"
      pop_midia_tipo: "imagem" | "audio" | "video" | "documento"
      pop_status: "rascunho" | "revisao" | "publicado"
      pop_visibilidade: "privado" | "empresa"
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
      app_role: ["admin", "gestor", "criador", "executor", "developer"],
      pop_midia_tipo: ["imagem", "audio", "video", "documento"],
      pop_status: ["rascunho", "revisao", "publicado"],
      pop_visibilidade: ["privado", "empresa"],
    },
  },
} as const

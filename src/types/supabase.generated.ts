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
      applications: {
        Row: {
          application_code: string
          application_id: string
          created_at: string
          description: string | null
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          application_code: string
          application_id?: string
          created_at?: string
          description?: string | null
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          application_code?: string
          application_id?: string
          created_at?: string
          description?: string | null
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      branches: {
        Row: {
          address: string
          branch_id: string
          business_id: string
          created_at: string
          district: string | null
          is_active: boolean
          latitude: number | null
          location_accuracy_meters: number | null
          longitude: number | null
          province: string | null
          updated_at: string
        }
        Insert: {
          address: string
          branch_id?: string
          business_id: string
          created_at?: string
          district?: string | null
          is_active?: boolean
          latitude?: number | null
          location_accuracy_meters?: number | null
          longitude?: number | null
          province?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          branch_id?: string
          business_id?: string
          created_at?: string
          district?: string | null
          is_active?: boolean
          latitude?: number | null
          location_accuracy_meters?: number | null
          longitude?: number | null
          province?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branches_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["business_id"]
          },
        ]
      }
      businesses: {
        Row: {
          activity_code: string | null
          business_id: string
          business_name: string | null
          company_id: string
          created_at: string
          identification_type: string
          is_active: boolean
          legal_id: string
          legal_name: string | null
          owner_name: string | null
          updated_at: string
        }
        Insert: {
          activity_code?: string | null
          business_id?: string
          business_name?: string | null
          company_id: string
          created_at?: string
          identification_type?: string
          is_active?: boolean
          legal_id: string
          legal_name?: string | null
          owner_name?: string | null
          updated_at?: string
        }
        Update: {
          activity_code?: string | null
          business_id?: string
          business_name?: string | null
          company_id?: string
          created_at?: string
          identification_type?: string
          is_active?: boolean
          legal_id?: string
          legal_name?: string | null
          owner_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "businesses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
        ]
      }
      categories: {
        Row: {
          catalog_slug: string | null
          category_id: string
          category_name: string
          created_at: string
          is_active: boolean
          storage_folder: string | null
          updated_at: string
        }
        Insert: {
          catalog_slug?: string | null
          category_id?: string
          category_name: string
          created_at?: string
          is_active?: boolean
          storage_folder?: string | null
          updated_at?: string
        }
        Update: {
          catalog_slug?: string | null
          category_id?: string
          category_name?: string
          created_at?: string
          is_active?: boolean
          storage_folder?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      category_product_types: {
        Row: {
          category_id: string
          created_at: string
          type_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          type_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_category_product_types_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "fk_category_product_types_type"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["type_id"]
          },
        ]
      }
      color_variants: {
        Row: {
          color: string | null
          fabric_id: string
          hex_color: string | null
          id: string
          quantity: number | null
        }
        Insert: {
          color?: string | null
          fabric_id: string
          hex_color?: string | null
          id?: string
          quantity?: number | null
        }
        Update: {
          color?: string | null
          fabric_id?: string
          hex_color?: string | null
          id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "color_variants_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          commercial_name: string | null
          company_id: string
          company_name: string
          created_at: string
          email: string | null
          is_active: boolean
          legal_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          commercial_name?: string | null
          company_id?: string
          company_name: string
          created_at?: string
          email?: string | null
          is_active?: boolean
          legal_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          commercial_name?: string | null
          company_id?: string
          company_name?: string
          created_at?: string
          email?: string | null
          is_active?: boolean
          legal_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      department_modules: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          department_id: string
          module_id: string
          updated_at: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          department_id: string
          module_id: string
          updated_at?: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          department_id?: string
          module_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_modules_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "department_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["module_id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          department_id: string
          email: string | null
          is_active: boolean
          is_it_support: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string
          email?: string | null
          is_active?: boolean
          is_it_support?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string
          email?: string | null
          is_active?: boolean
          is_it_support?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      dimensions: {
        Row: {
          created_at: string
          dimension_code: string
          dimension_id: string
          dimension_name: string
          display_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          dimension_code: string
          dimension_id?: string
          dimension_name: string
          display_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          dimension_code?: string
          dimension_id?: string
          dimension_name?: string
          display_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      emails: {
        Row: {
          business_id: string
          created_at: string
          email: string
          email_id: string
          is_primary: boolean
          type: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          email: string
          email_id?: string
          is_primary?: boolean
          type?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          email?: string
          email_id?: string
          is_primary?: boolean
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emails_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["business_id"]
          },
        ]
      }
      fabric_files: {
        Row: {
          created_at: string | null
          fabric_id: string
          file_name: string | null
          file_path: string | null
          file_size: number | null
          file_type: string | null
          id: string
          mime_type: string | null
          public_url: string | null
        }
        Insert: {
          created_at?: string | null
          fabric_id: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          mime_type?: string | null
          public_url?: string | null
        }
        Update: {
          created_at?: string | null
          fabric_id?: string
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          file_type?: string | null
          id?: string
          mime_type?: string | null
          public_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fabric_files_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
        ]
      }
      fabrics: {
        Row: {
          created_at: string | null
          description: string | null
          fabric_code: string | null
          fabric_name: string | null
          id: string
          image_url: string | null
          price: number | null
          provider: string | null
          type: string | null
          weave_type: string | null
          weight: string | null
          width: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fabric_code?: string | null
          fabric_name?: string | null
          id?: string
          image_url?: string | null
          price?: number | null
          provider?: string | null
          type?: string | null
          weave_type?: string | null
          weight?: string | null
          width?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fabric_code?: string | null
          fabric_name?: string | null
          id?: string
          image_url?: string | null
          price?: number | null
          provider?: string | null
          type?: string | null
          weave_type?: string | null
          weight?: string | null
          width?: string | null
        }
        Relationships: []
      }
      features: {
        Row: {
          fabric_id: string
          feature: string | null
          id: string
        }
        Insert: {
          fabric_id: string
          feature?: string | null
          id?: string
        }
        Update: {
          fabric_id?: string
          feature?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "features_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
        ]
      }
      it_ticket_attachments: {
        Row: {
          attachment_id: string
          bucket_name: string
          comment_id: string | null
          created_at: string
          file_name: string
          file_size: number | null
          folder_name: string
          is_internal: boolean
          is_valid: boolean
          mime_type: string | null
          object_path: string
          ticket_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          attachment_id?: string
          bucket_name?: string
          comment_id?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          folder_name?: string
          is_internal?: boolean
          is_valid?: boolean
          mime_type?: string | null
          object_path: string
          ticket_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          attachment_id?: string
          bucket_name?: string
          comment_id?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          folder_name?: string
          is_internal?: boolean
          is_valid?: boolean
          mime_type?: string | null
          object_path?: string
          ticket_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "it_ticket_attachments_comment_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "it_ticket_comments"
            referencedColumns: ["comment_id"]
          },
          {
            foreignKeyName: "it_ticket_attachments_ticket_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "it_tickets"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "it_ticket_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      it_ticket_categories: {
        Row: {
          category_code: string
          category_id: string
          category_name: string
          created_at: string
          default_department_id: string | null
          default_priority: string
          description: string | null
          is_active: boolean
          updated_at: string
        }
        Insert: {
          category_code: string
          category_id?: string
          category_name: string
          created_at?: string
          default_department_id?: string | null
          default_priority?: string
          description?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          category_code?: string
          category_id?: string
          category_name?: string
          created_at?: string
          default_department_id?: string | null
          default_priority?: string
          description?: string | null
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "it_ticket_categories_default_department_fkey"
            columns: ["default_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["department_id"]
          },
        ]
      }
      it_ticket_comments: {
        Row: {
          body: string
          comment_id: string
          comment_type: string
          created_at: string
          created_by: string | null
          is_edited: boolean
          is_internal: boolean
          ticket_id: string
          updated_at: string
        }
        Insert: {
          body: string
          comment_id?: string
          comment_type?: string
          created_at?: string
          created_by?: string | null
          is_edited?: boolean
          is_internal?: boolean
          ticket_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          comment_id?: string
          comment_type?: string
          created_at?: string
          created_by?: string | null
          is_edited?: boolean
          is_internal?: boolean
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "it_ticket_comments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "it_ticket_comments_ticket_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "it_tickets"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      it_ticket_history: {
        Row: {
          changed_by: string | null
          created_at: string
          detail: string | null
          event_type: string
          history_id: string
          metadata: Json
          new_value: string | null
          old_value: string | null
          ticket_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          detail?: string | null
          event_type: string
          history_id?: string
          metadata?: Json
          new_value?: string | null
          old_value?: string | null
          ticket_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          detail?: string | null
          event_type?: string
          history_id?: string
          metadata?: Json
          new_value?: string | null
          old_value?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "it_ticket_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "it_ticket_history_ticket_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "it_tickets"
            referencedColumns: ["ticket_id"]
          },
        ]
      }
      it_ticket_reads: {
        Row: {
          last_read_at: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          last_read_at?: string
          ticket_id: string
          user_id: string
        }
        Update: {
          last_read_at?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "it_ticket_reads_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "it_tickets"
            referencedColumns: ["ticket_id"]
          },
          {
            foreignKeyName: "it_ticket_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      it_tickets: {
        Row: {
          assigned_to_user_id: string | null
          branch_id: string | null
          business_id: string | null
          cancellation_reason: string | null
          category_id: string
          closed_at: string | null
          company_id: string
          created_at: string
          created_by: string | null
          description: string
          first_response_at: string | null
          impact: string
          is_active: boolean
          last_message_at: string
          origin_application: string
          priority: string
          representative_id: string | null
          requester_user_id: string | null
          resolution_due_at: string | null
          resolution_notes: string | null
          resolved_at: string | null
          response_due_at: string | null
          responsible_department_id: string | null
          source: string
          status: string
          ticket_id: string
          ticket_number: string
          title: string
          updated_at: string
          updated_by: string | null
          urgency: string
        }
        Insert: {
          assigned_to_user_id?: string | null
          branch_id?: string | null
          business_id?: string | null
          cancellation_reason?: string | null
          category_id: string
          closed_at?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          description: string
          first_response_at?: string | null
          impact?: string
          is_active?: boolean
          last_message_at?: string
          origin_application?: string
          priority: string
          representative_id?: string | null
          requester_user_id?: string | null
          resolution_due_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          response_due_at?: string | null
          responsible_department_id?: string | null
          source?: string
          status?: string
          ticket_id?: string
          ticket_number?: string
          title: string
          updated_at?: string
          updated_by?: string | null
          urgency?: string
        }
        Update: {
          assigned_to_user_id?: string | null
          branch_id?: string | null
          business_id?: string | null
          cancellation_reason?: string | null
          category_id?: string
          closed_at?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          first_response_at?: string | null
          impact?: string
          is_active?: boolean
          last_message_at?: string
          origin_application?: string
          priority?: string
          representative_id?: string | null
          requester_user_id?: string | null
          resolution_due_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          response_due_at?: string | null
          responsible_department_id?: string | null
          source?: string
          status?: string
          ticket_id?: string
          ticket_number?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          urgency?: string
        }
        Relationships: [
          {
            foreignKeyName: "it_tickets_assigned_to_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "it_tickets_branch_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "it_tickets_business_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "it_tickets_category_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "it_ticket_categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "it_tickets_company_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "it_tickets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "it_tickets_department_fkey"
            columns: ["responsible_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "it_tickets_representative_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "representatives"
            referencedColumns: ["representative_id"]
          },
          {
            foreignKeyName: "it_tickets_requester_fkey"
            columns: ["requester_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "it_tickets_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      logbooks: {
        Row: {
          created_at: string
          detail: string
          log_id: string
          log_time: string
          log_title: string | null
          module_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          detail: string
          log_id?: string
          log_time?: string
          log_title?: string | null
          module_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          detail?: string
          log_id?: string
          log_time?: string
          log_title?: string | null
          module_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logbooks_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "logbooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      managements: {
        Row: {
          fabric_id: string
          id: string
          management: string | null
        }
        Insert: {
          fabric_id: string
          id?: string
          management?: string | null
        }
        Update: {
          fabric_id?: string
          id?: string
          management?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "managements_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          fabric_id: string
          id: string
          material: string | null
          percentage: number | null
        }
        Insert: {
          fabric_id: string
          id?: string
          material?: string | null
          percentage?: number | null
        }
        Update: {
          fabric_id?: string
          id?: string
          material?: string | null
          percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "materials_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string
          display_order: number
          is_active: boolean
          is_assignable: boolean
          is_public: boolean
          module_code: string
          module_id: string
          name: string
          parent_module_id: string | null
          route: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          is_active?: boolean
          is_assignable?: boolean
          is_public?: boolean
          module_code: string
          module_id?: string
          name: string
          parent_module_id?: string | null
          route?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          is_active?: boolean
          is_assignable?: boolean
          is_public?: boolean
          module_code?: string
          module_id?: string
          name?: string
          parent_module_id?: string | null
          route?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_parent_module_id_fkey"
            columns: ["parent_module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["module_id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          description: string | null
          is_active: boolean
          method_id: string
          method_name: string
        }
        Insert: {
          description?: string | null
          is_active?: boolean
          method_id?: string
          method_name: string
        }
        Update: {
          description?: string | null
          is_active?: boolean
          method_id?: string
          method_name?: string
        }
        Relationships: []
      }
      payment_receipts: {
        Row: {
          bucket_name: string
          created_at: string
          created_by: string | null
          file_name: string | null
          file_size: number | null
          folder_name: string
          is_valid: boolean
          mime_type: string | null
          object_path: string
          payment_id: string
          payment_receipt_id: string
          updated_at: string
        }
        Insert: {
          bucket_name?: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_size?: number | null
          folder_name?: string
          is_valid?: boolean
          mime_type?: string | null
          object_path: string
          payment_id: string
          payment_receipt_id?: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_size?: number | null
          folder_name?: string
          is_valid?: boolean
          mime_type?: string | null
          object_path?: string
          payment_id?: string
          payment_receipt_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_receipts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payment_receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["payment_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          is_valid: boolean
          method_id: string | null
          notes: string | null
          payment_date: string
          payment_id: string
          production_order_id: string
          reference_number: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          is_valid?: boolean
          method_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_id?: string
          production_order_id: string
          reference_number?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          is_valid?: boolean
          method_id?: string | null
          notes?: string | null
          payment_date?: string
          payment_id?: string
          production_order_id?: string
          reference_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["method_id"]
          },
          {
            foreignKeyName: "payments_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["production_order_id"]
          },
        ]
      }
      phones: {
        Row: {
          branch_id: string | null
          business_id: string | null
          company_id: string | null
          created_at: string
          is_primary: boolean
          phone: string
          phone_id: string
          representative_id: string | null
          type: string | null
        }
        Insert: {
          branch_id?: string | null
          business_id?: string | null
          company_id?: string | null
          created_at?: string
          is_primary?: boolean
          phone: string
          phone_id?: string
          representative_id?: string | null
          type?: string | null
        }
        Update: {
          branch_id?: string | null
          business_id?: string | null
          company_id?: string | null
          created_at?: string
          is_primary?: boolean
          phone?: string
          phone_id?: string
          representative_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phones_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "phones_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "phones_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "phones_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "representatives"
            referencedColumns: ["representative_id"]
          },
        ]
      }
      product_collections: {
        Row: {
          category_id: string
          collection_id: string
          collection_name: string
          created_at: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          category_id: string
          collection_id?: string
          collection_name: string
          created_at?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          category_id?: string
          collection_id?: string
          collection_name?: string
          created_at?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_collections_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
        ]
      }
      product_types: {
        Row: {
          created_at: string
          product_type: string
          type_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          product_type: string
          type_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          product_type?: string
          type_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_variant_migration_map: {
        Row: {
          approved_gtin: string | null
          approved_sku: string | null
          color_name: string
          created_at: string
          keep_existing_variant: boolean
          legacy_sku: string
          migrated_variant_id: string | null
          migration_id: string
          migration_status: string
          product_id: string
          size_id: string
          suggested_sku: string | null
          updated_at: string
        }
        Insert: {
          approved_gtin?: string | null
          approved_sku?: string | null
          color_name?: string
          created_at?: string
          keep_existing_variant?: boolean
          legacy_sku: string
          migrated_variant_id?: string | null
          migration_id?: string
          migration_status?: string
          product_id: string
          size_id: string
          suggested_sku?: string | null
          updated_at?: string
        }
        Update: {
          approved_gtin?: string | null
          approved_sku?: string | null
          color_name?: string
          created_at?: string
          keep_existing_variant?: boolean
          legacy_sku?: string
          migrated_variant_id?: string | null
          migration_id?: string
          migration_status?: string
          product_id?: string
          size_id?: string
          suggested_sku?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_migration_map_migrated_variant_id_fkey"
            columns: ["migrated_variant_id"]
            isOneToOne: false
            referencedRelation: "textile_product_variants"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "product_variant_migration_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "textile_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variant_migration_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "textile_variant_migration_audit"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variant_migration_map_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["size_id"]
          },
        ]
      }
      production_order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          history_id: string
          new_status: string
          note: string
          previous_status: string
          production_order_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          history_id?: string
          new_status: string
          note: string
          previous_status: string
          production_order_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          history_id?: string
          new_status?: string
          note?: string
          previous_status?: string
          production_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "production_order_status_history_production_order_id_fkey"
            columns: ["production_order_id"]
            isOneToOne: false
            referencedRelation: "production_orders"
            referencedColumns: ["production_order_id"]
          },
        ]
      }
      production_orders: {
        Row: {
          balance: number
          committed_delivery_date: string | null
          created_at: string
          is_active: boolean
          next_payment_date: string | null
          overdue_days: number
          paid_at: string | null
          payment_status: string
          penalty_amount: number
          penalty_percentage: number
          production_order_code: string
          production_order_id: string
          production_order_status: string
          quotation_id: string
          status_change_note: string | null
          status_changed_at: string | null
          status_changed_by: string | null
          unexpected_delivery_date: string | null
          updated_at: string
        }
        Insert: {
          balance?: number
          committed_delivery_date?: string | null
          created_at?: string
          is_active?: boolean
          next_payment_date?: string | null
          overdue_days?: number
          paid_at?: string | null
          payment_status?: string
          penalty_amount?: number
          penalty_percentage?: number
          production_order_code: string
          production_order_id?: string
          production_order_status?: string
          quotation_id: string
          status_change_note?: string | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          unexpected_delivery_date?: string | null
          updated_at?: string
        }
        Update: {
          balance?: number
          committed_delivery_date?: string | null
          created_at?: string
          is_active?: boolean
          next_payment_date?: string | null
          overdue_days?: number
          paid_at?: string | null
          payment_status?: string
          penalty_amount?: number
          penalty_percentage?: number
          production_order_code?: string
          production_order_id?: string
          production_order_status?: string
          quotation_id?: string
          status_change_note?: string | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          unexpected_delivery_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_production_orders_quotation"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["quotation_id"]
          },
          {
            foreignKeyName: "production_orders_status_changed_by_fkey"
            columns: ["status_changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profile_modules: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          module_id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          module_id: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          module_id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_modules_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["module_id"]
          },
          {
            foreignKeyName: "profile_modules_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          identification: string | null
          is_active: boolean
          name: string | null
          phone: string | null
          surname: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          identification?: string | null
          is_active?: boolean
          name?: string | null
          phone?: string | null
          surname?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          identification?: string | null
          is_active?: boolean
          name?: string | null
          phone?: string | null
          surname?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotations: {
        Row: {
          advance_payment: number
          branch_id: string
          business_id: string
          company_id: string | null
          created_at: string
          early_delivery: boolean
          early_delivery_date: string | null
          early_delivery_price: number | null
          is_active: boolean
          iva_amount: number
          method_id: string | null
          notes: string | null
          quotation_id: string
          quotation_number: string
          representative_id: string
          state: string
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
          valid_until: string | null
        }
        Insert: {
          advance_payment?: number
          branch_id: string
          business_id: string
          company_id?: string | null
          created_at?: string
          early_delivery?: boolean
          early_delivery_date?: string | null
          early_delivery_price?: number | null
          is_active?: boolean
          iva_amount?: number
          method_id?: string | null
          notes?: string | null
          quotation_id?: string
          quotation_number: string
          representative_id: string
          state?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          valid_until?: string | null
        }
        Update: {
          advance_payment?: number
          branch_id?: string
          business_id?: string
          company_id?: string | null
          created_at?: string
          early_delivery?: boolean
          early_delivery_date?: string | null
          early_delivery_price?: number | null
          is_active?: boolean
          iva_amount?: number
          method_id?: string | null
          notes?: string | null
          quotation_id?: string
          quotation_number?: string
          representative_id?: string
          state?: string
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotations_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "quotations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "quotations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "quotations_method_id_fkey"
            columns: ["method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["method_id"]
          },
          {
            foreignKeyName: "quotations_representative_id_fkey"
            columns: ["representative_id"]
            isOneToOne: false
            referencedRelation: "representatives"
            referencedColumns: ["representative_id"]
          },
          {
            foreignKeyName: "quotations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quote_products: {
        Row: {
          color_hex_snapshot: string | null
          color_name_snapshot: string | null
          created_at: string
          embroidery_price_snapshot: number | null
          gtin_snapshot: string | null
          has_embroidery: boolean | null
          has_sublimation: boolean | null
          iva_amount: number
          iva_rate_snapshot: number | null
          product_id: string
          product_name_snapshot: string | null
          quantity: number
          quotation_id: string
          quote_product_id: string
          size_id: string | null
          size_name_snapshot: string | null
          sku_snapshot: string | null
          snapshot_color: string | null
          snapshot_description: string | null
          snapshot_gtin: string | null
          snapshot_price: number | null
          snapshot_size_id: string | null
          snapshot_size_name: string | null
          snapshot_sku: string | null
          snapshot_tax_rate: number | null
          sublimation_price_snapshot: number | null
          subtotal: number | null
          total: number | null
          unit_price: number
          updated_at: string
          variant_description_snapshot: string | null
          variant_id: string
        }
        Insert: {
          color_hex_snapshot?: string | null
          color_name_snapshot?: string | null
          created_at?: string
          embroidery_price_snapshot?: number | null
          gtin_snapshot?: string | null
          has_embroidery?: boolean | null
          has_sublimation?: boolean | null
          iva_amount?: number
          iva_rate_snapshot?: number | null
          product_id: string
          product_name_snapshot?: string | null
          quantity?: number
          quotation_id: string
          quote_product_id?: string
          size_id?: string | null
          size_name_snapshot?: string | null
          sku_snapshot?: string | null
          snapshot_color?: string | null
          snapshot_description?: string | null
          snapshot_gtin?: string | null
          snapshot_price?: number | null
          snapshot_size_id?: string | null
          snapshot_size_name?: string | null
          snapshot_sku?: string | null
          snapshot_tax_rate?: number | null
          sublimation_price_snapshot?: number | null
          subtotal?: number | null
          total?: number | null
          unit_price: number
          updated_at?: string
          variant_description_snapshot?: string | null
          variant_id: string
        }
        Update: {
          color_hex_snapshot?: string | null
          color_name_snapshot?: string | null
          created_at?: string
          embroidery_price_snapshot?: number | null
          gtin_snapshot?: string | null
          has_embroidery?: boolean | null
          has_sublimation?: boolean | null
          iva_amount?: number
          iva_rate_snapshot?: number | null
          product_id?: string
          product_name_snapshot?: string | null
          quantity?: number
          quotation_id?: string
          quote_product_id?: string
          size_id?: string | null
          size_name_snapshot?: string | null
          sku_snapshot?: string | null
          snapshot_color?: string | null
          snapshot_description?: string | null
          snapshot_gtin?: string | null
          snapshot_price?: number | null
          snapshot_size_id?: string | null
          snapshot_size_name?: string | null
          snapshot_sku?: string | null
          snapshot_tax_rate?: number | null
          sublimation_price_snapshot?: number | null
          subtotal?: number | null
          total?: number | null
          unit_price?: number
          updated_at?: string
          variant_description_snapshot?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "textile_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "quote_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "textile_variant_migration_audit"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "quote_products_product_variant_fkey"
            columns: ["product_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "textile_product_variants"
            referencedColumns: ["product_id", "variant_id"]
          },
          {
            foreignKeyName: "quote_products_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["quotation_id"]
          },
          {
            foreignKeyName: "quote_products_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["size_id"]
          },
          {
            foreignKeyName: "quote_products_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "textile_product_variants"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      representatives: {
        Row: {
          branch_id: string | null
          business_id: string
          created_at: string
          email: string | null
          is_active: boolean
          name: string
          representative_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          branch_id?: string | null
          business_id: string
          created_at?: string
          email?: string | null
          is_active?: boolean
          name: string
          representative_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          branch_id?: string | null
          business_id?: string
          created_at?: string
          email?: string | null
          is_active?: boolean
          name?: string
          representative_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "representatives_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["branch_id"]
          },
          {
            foreignKeyName: "representatives_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "representatives_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          is_active: boolean
          role_code: string
          role_id: string
          role_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          role_code: string
          role_id?: string
          role_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          role_code?: string
          role_id?: string
          role_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sizes: {
        Row: {
          created_at: string
          display_order: number
          size_id: string
          size_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          size_id?: string
          size_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          size_id?: string
          size_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      textile_product_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          mime_type: string
          product_id: string
          public_url: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          mime_type: string
          product_id: string
          public_url: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          mime_type?: string
          product_id?: string
          public_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_textile_product_files_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "textile_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "fk_textile_product_files_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "textile_variant_migration_audit"
            referencedColumns: ["product_id"]
          },
        ]
      }
      textile_product_measurements: {
        Row: {
          created_at: string
          dimension_id: string
          measurement_id: string
          measurement_value: number
          product_id: string
          size_id: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dimension_id: string
          measurement_id?: string
          measurement_value: number
          product_id: string
          size_id: string
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dimension_id?: string
          measurement_id?: string
          measurement_value?: number
          product_id?: string
          size_id?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_product_measurements_dimension"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "dimensions"
            referencedColumns: ["dimension_id"]
          },
          {
            foreignKeyName: "fk_product_measurements_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "textile_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "fk_product_measurements_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "textile_variant_migration_audit"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "fk_product_measurements_size"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["size_id"]
          },
        ]
      }
      textile_product_variant_measurements: {
        Row: {
          created_at: string
          dimension_id: string
          measurement_id: string
          measurement_value: number
          unit: string
          updated_at: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          dimension_id: string
          measurement_id?: string
          measurement_value: number
          unit?: string
          updated_at?: string
          variant_id: string
        }
        Update: {
          created_at?: string
          dimension_id?: string
          measurement_id?: string
          measurement_value?: number
          unit?: string
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "textile_product_variant_measurements_dimension_fkey"
            columns: ["dimension_id"]
            isOneToOne: false
            referencedRelation: "dimensions"
            referencedColumns: ["dimension_id"]
          },
          {
            foreignKeyName: "textile_product_variant_measurements_variant_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "textile_product_variants"
            referencedColumns: ["variant_id"]
          },
        ]
      }
      textile_product_variants: {
        Row: {
          color_hex: string | null
          color_name: string | null
          created_at: string
          embroidery_price: number | null
          gtin: string | null
          is_active: boolean
          is_default: boolean
          iva: number
          minimum_stock: number
          price: number
          product_id: string
          reserved_quantity: number
          size_id: string | null
          sku: string
          stock_quantity: number
          sublimation_price: number | null
          updated_at: string
          variant_id: string
        }
        Insert: {
          color_hex?: string | null
          color_name?: string | null
          created_at?: string
          embroidery_price?: number | null
          gtin?: string | null
          is_active?: boolean
          is_default?: boolean
          iva?: number
          minimum_stock?: number
          price: number
          product_id: string
          reserved_quantity?: number
          size_id?: string | null
          sku: string
          stock_quantity?: number
          sublimation_price?: number | null
          updated_at?: string
          variant_id?: string
        }
        Update: {
          color_hex?: string | null
          color_name?: string | null
          created_at?: string
          embroidery_price?: number | null
          gtin?: string | null
          is_active?: boolean
          is_default?: boolean
          iva?: number
          minimum_stock?: number
          price?: number
          product_id?: string
          reserved_quantity?: number
          size_id?: string | null
          sku?: string
          stock_quantity?: number
          sublimation_price?: number | null
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "textile_product_variants_product_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "textile_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "textile_product_variants_product_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "textile_variant_migration_audit"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "textile_product_variants_size_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "sizes"
            referencedColumns: ["size_id"]
          },
        ]
      }
      textile_products: {
        Row: {
          category_id: string
          collection_id: string | null
          created_at: string
          description: string
          embroidery: boolean
          embroidery_price: number | null
          height: string | null
          is_active: boolean
          iva: number
          length: string | null
          price: number
          product_id: string
          product_name: string
          size: string | null
          sku: string
          sublimation: boolean
          sublimation_price: number | null
          type_id: string
          unit: string | null
          updated_at: string
          width: string | null
        }
        Insert: {
          category_id: string
          collection_id?: string | null
          created_at?: string
          description: string
          embroidery?: boolean
          embroidery_price?: number | null
          height?: string | null
          is_active?: boolean
          iva?: number
          length?: string | null
          price: number
          product_id?: string
          product_name: string
          size?: string | null
          sku: string
          sublimation?: boolean
          sublimation_price?: number | null
          type_id: string
          unit?: string | null
          updated_at?: string
          width?: string | null
        }
        Update: {
          category_id?: string
          collection_id?: string | null
          created_at?: string
          description?: string
          embroidery?: boolean
          embroidery_price?: number | null
          height?: string | null
          is_active?: boolean
          iva?: number
          length?: string | null
          price?: number
          product_id?: string
          product_name?: string
          size?: string | null
          sku?: string
          sublimation?: boolean
          sublimation_price?: number | null
          type_id?: string
          unit?: string | null
          updated_at?: string
          width?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_textile_products_category"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["category_id"]
          },
          {
            foreignKeyName: "fk_textile_products_collection"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "product_collections"
            referencedColumns: ["collection_id"]
          },
          {
            foreignKeyName: "fk_textile_products_type"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["type_id"]
          },
          {
            foreignKeyName: "textile_products_category_type_fkey"
            columns: ["category_id", "type_id"]
            isOneToOne: false
            referencedRelation: "category_product_types"
            referencedColumns: ["category_id", "type_id"]
          },
        ]
      }
      user_applications: {
        Row: {
          application_id: string
          created_at: string
          end_date: string | null
          is_active: boolean
          start_date: string
          updated_at: string
          user_application_id: string
          user_id: string
        }
        Insert: {
          application_id: string
          created_at?: string
          end_date?: string | null
          is_active?: boolean
          start_date?: string
          updated_at?: string
          user_application_id?: string
          user_id: string
        }
        Update: {
          application_id?: string
          created_at?: string
          end_date?: string | null
          is_active?: boolean
          start_date?: string
          updated_at?: string
          user_application_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_applications_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["application_id"]
          },
          {
            foreignKeyName: "user_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_memberships: {
        Row: {
          company_id: string
          created_at: string
          department_id: string | null
          end_date: string | null
          is_active: boolean
          membership_id: string
          role_id: string
          start_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          department_id?: string | null
          end_date?: string | null
          is_active?: boolean
          membership_id?: string
          role_id: string
          start_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          department_id?: string | null
          end_date?: string | null
          is_active?: boolean
          membership_id?: string
          role_id?: string
          start_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["company_id"]
          },
          {
            foreignKeyName: "user_memberships_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["department_id"]
          },
          {
            foreignKeyName: "user_memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
          {
            foreignKeyName: "user_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_notifications: {
        Row: {
          audience_application: string
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          message: string
          metadata: Json
          notification_id: string
          read_at: string | null
          source_application: string
          target_path_ecommerce: string | null
          target_path_saas: string | null
          title: string
          user_id: string
        }
        Insert: {
          audience_application: string
          created_at?: string
          entity_id: string
          entity_type: string
          event_type: string
          message: string
          metadata?: Json
          notification_id?: string
          read_at?: string | null
          source_application: string
          target_path_ecommerce?: string | null
          target_path_saas?: string | null
          title: string
          user_id: string
        }
        Update: {
          audience_application?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          message?: string
          metadata?: Json
          notification_id?: string
          read_at?: string | null
          source_application?: string
          target_path_ecommerce?: string | null
          target_path_saas?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      variant_files: {
        Row: {
          created_at: string
          display_order: number
          file_name: string
          file_size: number | null
          file_type: string
          is_active: boolean
          is_primary: boolean
          mime_type: string | null
          object_path: string
          public_url: string | null
          updated_at: string
          variant_file_id: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          file_name: string
          file_size?: number | null
          file_type: string
          is_active?: boolean
          is_primary?: boolean
          mime_type?: string | null
          object_path: string
          public_url?: string | null
          updated_at?: string
          variant_file_id?: string
          variant_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          file_name?: string
          file_size?: number | null
          file_type?: string
          is_active?: boolean
          is_primary?: boolean
          mime_type?: string | null
          object_path?: string
          public_url?: string | null
          updated_at?: string
          variant_file_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_files_variant_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "textile_product_variants"
            referencedColumns: ["variant_id"]
          },
        ]
      }
    }
    Views: {
      product_variant_migration_review: {
        Row: {
          approved_gtin: string | null
          approved_sku: string | null
          category_name: string | null
          color_name: string | null
          keep_existing_variant: boolean | null
          legacy_sku: string | null
          migrated_variant_id: string | null
          migration_id: string | null
          migration_status: string | null
          product_id: string | null
          product_name: string | null
          product_type: string | null
          size_name: string | null
          suggested_sku: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_migration_map_migrated_variant_id_fkey"
            columns: ["migrated_variant_id"]
            isOneToOne: false
            referencedRelation: "textile_product_variants"
            referencedColumns: ["variant_id"]
          },
          {
            foreignKeyName: "product_variant_migration_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "textile_products"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variant_migration_map_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "textile_variant_migration_audit"
            referencedColumns: ["product_id"]
          },
        ]
      }
      textile_variant_migration_audit: {
        Row: {
          has_default_variant: boolean | null
          legacy_measurement_size_count: number | null
          legacy_sku: string | null
          migrated_measurement_count: number | null
          product_id: string | null
          product_name: string | null
          variant_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_save_textile_product_v2: {
        Args: {
          p_deactivate_variant_ids?: string[]
          p_product: Json
          p_product_files?: Json
          p_product_id?: string
          p_variants: Json
        }
        Returns: string
      }
      can_access_it_ticket: { Args: { p_ticket_id: string }; Returns: boolean }
      can_manage_system_users: {
        Args: { check_user_id?: string }
        Returns: boolean
      }
      codex_slug_part: { Args: { value: string }; Returns: string }
      create_production_order_from_quotation: {
        Args: { p_quotation_id: string }
        Returns: {
          balance: number
          committed_delivery_date: string | null
          created_at: string
          is_active: boolean
          next_payment_date: string | null
          overdue_days: number
          paid_at: string | null
          payment_status: string
          penalty_amount: number
          penalty_percentage: number
          production_order_code: string
          production_order_id: string
          production_order_status: string
          quotation_id: string
          status_change_note: string | null
          status_changed_at: string | null
          status_changed_by: string | null
          unexpected_delivery_date: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "production_orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_textile_product_with_variants: {
        Args: { payload: Json }
        Returns: string
      }
      generate_it_ticket_number: { Args: never; Returns: string }
      get_ecommerce_users_for_admin: {
        Args: never
        Returns: {
          application_access_active: boolean
          application_active: boolean
          application_end_date: string
          application_start_date: string
          companies: string[]
          department_name: string
          email: string
          last_activity: string
          name: string
          phone: string
          profile_active: boolean
          profile_created_at: string
          profile_id: string
          role_code: string
          role_name: string
          surname: string
          user_application_id: string
        }[]
      }
      insert_payment: {
        Args: {
          p_amount: number
          p_created_by: string
          p_method_id: string
          p_notes: string
          p_payment_date: string
          p_production_order_id: string
          p_reference_number: string
        }
        Returns: string
      }
      insert_payment_receipt: {
        Args: {
          p_bucket_name: string
          p_created_by: string
          p_file_name: string
          p_file_size: number
          p_folder_name: string
          p_mime_type: string
          p_object_path: string
          p_payment_id: string
        }
        Returns: undefined
      }
      is_active_company_member: {
        Args: { p_company_id: string }
        Returns: boolean
      }
      is_valid_gtin: { Args: { p_gtin: string }; Returns: boolean }
      recalculate_all_overdue_production_orders: {
        Args: never
        Returns: number
      }
      recalculate_production_order_penalty: {
        Args: { p_production_order_id: string }
        Returns: undefined
      }
      secure_create_production_order_from_quotation: {
        Args: { p_quotation_id: string }
        Returns: Json
      }
      support_add_message: {
        Args: { p_body: string; p_is_internal?: boolean; p_ticket_id: string }
        Returns: string
      }
      support_can_access_ticket: {
        Args: { p_ticket_id: string; p_user_id?: string }
        Returns: boolean
      }
      support_create_ticket: {
        Args: {
          p_category_code: string
          p_company_id?: string
          p_description: string
          p_impact?: string
          p_origin_application?: string
          p_title: string
          p_urgency?: string
        }
        Returns: string
      }
      support_delete_expired_closed_tickets: { Args: never; Returns: number }
      support_is_it_agent: { Args: { p_user_id?: string }; Returns: boolean }
      support_list_messages: { Args: { p_ticket_id: string }; Returns: Json[] }
      support_list_tickets: { Args: { p_all?: boolean }; Returns: Json[] }
      support_mark_read: { Args: { p_ticket_id: string }; Returns: undefined }
      support_update_ticket: {
        Args: {
          p_assign_to_self?: boolean
          p_status?: string
          p_ticket_id: string
        }
        Returns: undefined
      }
      unaccent: { Args: { "": string }; Returns: string }
      update_textile_product_with_variants: {
        Args: { payload: Json }
        Returns: string
      }
    }
    Enums: {
      legal_entity_type: "LEGAL" | "NATURAL"
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
      legal_entity_type: ["LEGAL", "NATURAL"],
    },
  },
} as const

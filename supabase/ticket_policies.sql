-- Políticas complementarias para implementacion_tickets_ti_v2.sql
-- Ejecutar después del script principal.

BEGIN;

ALTER TABLE public.it_ticket_attachments
  ALTER COLUMN bucket_name SET DEFAULT 'System_Files';

CREATE OR REPLACE FUNCTION public.can_access_it_ticket(p_ticket_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.it_tickets ticket
    WHERE ticket.ticket_id = p_ticket_id
      AND ticket.is_active = true
      AND (
        ticket.requester_user_id = auth.uid()
        OR ticket.assigned_to_user_id = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.user_memberships membership
          WHERE membership.user_id = auth.uid()
            AND membership.department_id = ticket.responsible_department_id
            AND membership.is_active = true
            AND COALESCE(membership.start_date, CURRENT_DATE) <= CURRENT_DATE
            AND (membership.end_date IS NULL OR membership.end_date >= CURRENT_DATE)
        )
      )
  );
$$;

REVOKE ALL ON FUNCTION public.can_access_it_ticket(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_access_it_ticket(uuid) TO authenticated;

GRANT SELECT ON public.it_ticket_categories TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.it_tickets TO authenticated;
GRANT SELECT, INSERT ON public.it_ticket_comments TO authenticated;
GRANT SELECT, INSERT ON public.it_ticket_attachments TO authenticated;
GRANT SELECT ON public.it_ticket_history TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.it_ticket_number_seq TO authenticated;

ALTER TABLE public.it_ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.it_ticket_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS it_categories_authenticated_read ON public.it_ticket_categories;
CREATE POLICY it_categories_authenticated_read
ON public.it_ticket_categories FOR SELECT TO authenticated
USING (is_active = true);

DROP POLICY IF EXISTS it_tickets_accessible_read ON public.it_tickets;
CREATE POLICY it_tickets_accessible_read
ON public.it_tickets FOR SELECT TO authenticated
USING (public.can_access_it_ticket(ticket_id));

DROP POLICY IF EXISTS it_tickets_requester_create ON public.it_tickets;
CREATE POLICY it_tickets_requester_create
ON public.it_tickets FOR INSERT TO authenticated
WITH CHECK (
  requester_user_id = auth.uid()
  AND created_by = auth.uid()
  AND company_id IS NOT NULL
);

DROP POLICY IF EXISTS it_tickets_requester_rollback ON public.it_tickets;
CREATE POLICY it_tickets_requester_rollback
ON public.it_tickets FOR DELETE TO authenticated
USING (
  requester_user_id = auth.uid()
  AND status = 'new'
  AND assigned_to_user_id IS NULL
);

DROP POLICY IF EXISTS it_comments_accessible_read ON public.it_ticket_comments;
CREATE POLICY it_comments_accessible_read
ON public.it_ticket_comments FOR SELECT TO authenticated
USING (
  public.can_access_it_ticket(ticket_id)
  AND (is_internal = false OR created_by = auth.uid())
);

DROP POLICY IF EXISTS it_comments_requester_create ON public.it_ticket_comments;
CREATE POLICY it_comments_requester_create
ON public.it_ticket_comments FOR INSERT TO authenticated
WITH CHECK (
  created_by = auth.uid()
  AND is_internal = false
  AND public.can_access_it_ticket(ticket_id)
);

DROP POLICY IF EXISTS it_attachments_accessible_read ON public.it_ticket_attachments;
CREATE POLICY it_attachments_accessible_read
ON public.it_ticket_attachments FOR SELECT TO authenticated
USING (
  public.can_access_it_ticket(ticket_id)
  AND (is_internal = false OR uploaded_by = auth.uid())
);

DROP POLICY IF EXISTS it_attachments_uploader_create ON public.it_ticket_attachments;
CREATE POLICY it_attachments_uploader_create
ON public.it_ticket_attachments FOR INSERT TO authenticated
WITH CHECK (
  uploaded_by = auth.uid()
  AND is_internal = false
  AND public.can_access_it_ticket(ticket_id)
);

DROP POLICY IF EXISTS it_history_accessible_read ON public.it_ticket_history;
CREATE POLICY it_history_accessible_read
ON public.it_ticket_history FOR SELECT TO authenticated
USING (public.can_access_it_ticket(ticket_id));

INSERT INTO storage.buckets (id, name, public)
VALUES ('System_Files', 'System_Files', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS it_ticket_files_read ON storage.objects;
CREATE POLICY it_ticket_files_read
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'System_Files'
  AND (storage.foldername(name))[1] = 'tickets'
  AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND public.can_access_it_ticket(((storage.foldername(name))[2])::uuid)
);

DROP POLICY IF EXISTS it_ticket_files_create ON storage.objects;
CREATE POLICY it_ticket_files_create
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'System_Files'
  AND (storage.foldername(name))[1] = 'tickets'
  AND (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  AND public.can_access_it_ticket(((storage.foldername(name))[2])::uuid)
);

DROP POLICY IF EXISTS it_ticket_files_delete ON storage.objects;
CREATE POLICY it_ticket_files_delete
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'System_Files'
  AND owner_id = auth.uid()::text
  AND (storage.foldername(name))[1] = 'tickets'
);

COMMIT;

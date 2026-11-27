-- FENIX TRAINING - SEGURANCA DO PAINEL ADMINISTRATIVO
-- Execute no SQL Editor do Supabase depois de conferir os nomes das colunas.

-- 1) Vincula cada registro de clientes ao usuario autenticado no Supabase Auth.
ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user';

-- 2) Vincula cadastros antigos ao Auth pelo e-mail.
UPDATE public.clientes AS c
SET auth_user_id = u.id
FROM auth.users AS u
WHERE lower(c.email) = lower(u.email)
  AND c.auth_user_id IS NULL;

-- 3) Funcao segura para verificar administradores sem recursao nas politicas RLS.
CREATE OR REPLACE FUNCTION public.is_fenix_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clientes c
    WHERE c.auth_user_id = (SELECT auth.uid())
      AND c.role = 'adm'
  );
$$;

REVOKE ALL ON FUNCTION public.is_fenix_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_fenix_admin() TO authenticated;

-- 4) Cria automaticamente o perfil quando uma conta e criada no Supabase Auth.
-- A senha NAO e copiada para clientes.
CREATE OR REPLACE FUNCTION public.fenix_criar_cliente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.clientes (
    auth_user_id,
    nome,
    username,
    cpf,
    nascdate,
    email,
    role
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'nome', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'username', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'cpf', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'nascdate', '')::date,
    NEW.email,
    'user'
  )
  ON CONFLICT (auth_user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fenix_auth_user_created ON auth.users;
CREATE TRIGGER fenix_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.fenix_criar_cliente();

-- 5) RLS em clientes: usuario consulta o proprio perfil; admin gerencia clientes.
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cliente_ver_proprio_perfil" ON public.clientes;
CREATE POLICY "cliente_ver_proprio_perfil"
ON public.clientes FOR SELECT TO authenticated
USING (auth_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "admin_ver_clientes" ON public.clientes;
CREATE POLICY "admin_ver_clientes"
ON public.clientes FOR SELECT TO authenticated
USING (public.is_fenix_admin());

DROP POLICY IF EXISTS "admin_atualizar_clientes" ON public.clientes;
CREATE POLICY "admin_atualizar_clientes"
ON public.clientes FOR UPDATE TO authenticated
USING (public.is_fenix_admin())
WITH CHECK (public.is_fenix_admin());

DROP POLICY IF EXISTS "admin_excluir_clientes" ON public.clientes;
CREATE POLICY "admin_excluir_clientes"
ON public.clientes FOR DELETE TO authenticated
USING (public.is_fenix_admin());

-- 6) RLS em treinos: leitura para o catalogo; escrita somente para admins.
ALTER TABLE public.treinos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "treinos_leitura_catalogo" ON public.treinos;
CREATE POLICY "treinos_leitura_catalogo"
ON public.treinos FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "admin_inserir_treinos" ON public.treinos;
CREATE POLICY "admin_inserir_treinos"
ON public.treinos FOR INSERT TO authenticated
WITH CHECK (public.is_fenix_admin());

DROP POLICY IF EXISTS "admin_atualizar_treinos" ON public.treinos;
CREATE POLICY "admin_atualizar_treinos"
ON public.treinos FOR UPDATE TO authenticated
USING (public.is_fenix_admin())
WITH CHECK (public.is_fenix_admin());

DROP POLICY IF EXISTS "admin_excluir_treinos" ON public.treinos;
CREATE POLICY "admin_excluir_treinos"
ON public.treinos FOR DELETE TO authenticated
USING (public.is_fenix_admin());

SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('clientes', 'treinos')
ORDER BY tablename, policyname;

-- 8) Lista todos os usuários do sistema (ativos e inativos) para o painel.
-- A função une auth.users com clientes, incluindo perfis antigos sem conta vinculada.
CREATE OR REPLACE FUNCTION public.listar_usuarios_fenix()
RETURNS TABLE (
  perfil_id text,
  auth_user_id uuid,
  nome text,
  email text,
  role text,
  status text,
  ultimo_acesso timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id::text AS perfil_id,
    u.id AS auth_user_id,
    COALESCE(NULLIF(c.nome, ''), NULLIF(u.raw_user_meta_data ->> 'nome', ''), '') AS nome,
    COALESCE(NULLIF(u.email, ''), NULLIF(c.email, ''), '') AS email,
    COALESCE(c.role, 'user') AS role,
    CASE
      WHEN u.id IS NULL THEN 'Inativo'
      WHEN u.deleted_at IS NOT NULL THEN 'Inativo'
      WHEN u.banned_until IS NOT NULL AND u.banned_until > now() THEN 'Inativo'
      WHEN u.email_confirmed_at IS NULL THEN 'Pendente'
      ELSE 'Ativo'
    END AS status,
    u.last_sign_in_at AS ultimo_acesso
  FROM auth.users AS u
  FULL JOIN public.clientes AS c ON c.auth_user_id = u.id
  WHERE public.is_fenix_admin()
  ORDER BY COALESCE(u.last_sign_in_at, '1970-01-01'::timestamptz) DESC;
$$;

REVOKE ALL ON FUNCTION public.listar_usuarios_fenix() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.listar_usuarios_fenix() TO authenticated;

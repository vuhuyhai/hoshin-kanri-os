-- =============================================================
-- Soft-reset toàn bộ data nghiệp vụ của agency@marfit.vn
-- =============================================================
-- GIỮ:  auth.users, public.users, profiles, organizations,
--       org_members, subscriptions, blog_*, newsletter_*
-- XOÁ:  kpi_entries, kpis, tows_strategies, swot_factors,
--       swot_analyses, x_matrices, discovery_sessions,
--       xray_results, xray_leads, notification_logs, admin_notes
--
-- Toàn bộ chạy trong 1 transaction. Lỗi giữa chừng → ROLLBACK.
--
-- HƯỚNG DẪN CHẠY:
--   $env:SUPABASE_ACCESS_TOKEN="sbp_xxx"
--   node scripts/apply-migration.mjs reset_agency_marfit.sql
-- =============================================================

BEGIN;

DO $$
DECLARE
  _email      text := 'agency@marfit.vn';
  _user_id    uuid;
  _org_id     uuid;
  _org_count  int;
  _row_count  int;
BEGIN
  -- Resolve user_id qua email
  SELECT id INTO _user_id FROM public.users WHERE email = _email;
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User % không tồn tại trong public.users', _email;
  END IF;

  -- Resolve org_id qua org_members. Yêu cầu duy nhất 1 org để tránh
  -- xoá nhầm dữ liệu của org khác mà user đang là member.
  SELECT COUNT(*), MAX(org_id) INTO _org_count, _org_id
  FROM org_members WHERE user_id = _user_id;
  IF _org_count = 0 THEN
    RAISE EXCEPTION 'User % không thuộc org nào (org_members rỗng)', _user_id;
  ELSIF _org_count > 1 THEN
    RAISE EXCEPTION 'User % thuộc % orgs — script yêu cầu duy nhất 1 org', _user_id, _org_count;
  END IF;

  RAISE NOTICE '[RESOLVE] user_id=%, org_id=%', _user_id, _org_id;

  -- 1. kpi_entries: theo user_id HOẶC theo kpi của org
  DELETE FROM kpi_entries
  WHERE user_id = _user_id
     OR kpi_id IN (SELECT id FROM kpis WHERE org_id = _org_id);
  GET DIAGNOSTICS _row_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from kpi_entries', _row_count;

  -- 2. kpis của org
  DELETE FROM kpis WHERE org_id = _org_id;
  GET DIAGNOSTICS _row_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from kpis', _row_count;

  -- 3. tows_strategies (có column org_id trực tiếp, verified trong types.ts)
  DELETE FROM tows_strategies WHERE org_id = _org_id;
  GET DIAGNOSTICS _row_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from tows_strategies', _row_count;

  -- 4. swot_factors
  DELETE FROM swot_factors WHERE org_id = _org_id;
  GET DIAGNOSTICS _row_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from swot_factors', _row_count;

  -- 5. swot_analyses
  DELETE FROM swot_analyses WHERE org_id = _org_id;
  GET DIAGNOSTICS _row_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from swot_analyses', _row_count;

  -- 6. x_matrices
  DELETE FROM x_matrices WHERE org_id = _org_id;
  GET DIAGNOSTICS _row_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from x_matrices', _row_count;

  -- 7. discovery_sessions theo org HOẶC user
  DELETE FROM discovery_sessions WHERE org_id = _org_id OR user_id = _user_id;
  GET DIAGNOSTICS _row_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from discovery_sessions', _row_count;

  -- 8. xray_results theo org HOẶC user
  DELETE FROM xray_results WHERE org_id = _org_id OR user_id = _user_id;
  GET DIAGNOSTICS _row_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from xray_results', _row_count;

  -- 9. xray_leads (public lead gen, filter theo email)
  DELETE FROM xray_leads WHERE email = _email;
  GET DIAGNOSTICS _row_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from xray_leads', _row_count;

  -- 10. notification_logs theo org HOẶC user
  DELETE FROM notification_logs WHERE org_id = _org_id OR user_id = _user_id;
  GET DIAGNOSTICS _row_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from notification_logs', _row_count;

  -- 11. admin_notes
  DELETE FROM admin_notes WHERE org_id = _org_id;
  GET DIAGNOSTICS _row_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from admin_notes', _row_count;

  -- =============================================================
  -- VERIFY: tất cả 11 bảng phải = 0 sau khi xoá (vẫn trong cùng tx)
  -- =============================================================
  SELECT COUNT(*) INTO _row_count FROM kpi_entries
    WHERE user_id = _user_id OR kpi_id IN (SELECT id FROM kpis WHERE org_id = _org_id);
  RAISE NOTICE '[VERIFY] kpi_entries remaining: %', _row_count;

  SELECT COUNT(*) INTO _row_count FROM kpis WHERE org_id = _org_id;
  RAISE NOTICE '[VERIFY] kpis remaining: %', _row_count;

  SELECT COUNT(*) INTO _row_count FROM tows_strategies WHERE org_id = _org_id;
  RAISE NOTICE '[VERIFY] tows_strategies remaining: %', _row_count;

  SELECT COUNT(*) INTO _row_count FROM swot_factors WHERE org_id = _org_id;
  RAISE NOTICE '[VERIFY] swot_factors remaining: %', _row_count;

  SELECT COUNT(*) INTO _row_count FROM swot_analyses WHERE org_id = _org_id;
  RAISE NOTICE '[VERIFY] swot_analyses remaining: %', _row_count;

  SELECT COUNT(*) INTO _row_count FROM x_matrices WHERE org_id = _org_id;
  RAISE NOTICE '[VERIFY] x_matrices remaining: %', _row_count;

  SELECT COUNT(*) INTO _row_count FROM discovery_sessions
    WHERE org_id = _org_id OR user_id = _user_id;
  RAISE NOTICE '[VERIFY] discovery_sessions remaining: %', _row_count;

  SELECT COUNT(*) INTO _row_count FROM xray_results
    WHERE org_id = _org_id OR user_id = _user_id;
  RAISE NOTICE '[VERIFY] xray_results remaining: %', _row_count;

  SELECT COUNT(*) INTO _row_count FROM xray_leads WHERE email = _email;
  RAISE NOTICE '[VERIFY] xray_leads remaining: %', _row_count;

  SELECT COUNT(*) INTO _row_count FROM notification_logs
    WHERE org_id = _org_id OR user_id = _user_id;
  RAISE NOTICE '[VERIFY] notification_logs remaining: %', _row_count;

  SELECT COUNT(*) INTO _row_count FROM admin_notes WHERE org_id = _org_id;
  RAISE NOTICE '[VERIFY] admin_notes remaining: %', _row_count;

  RAISE NOTICE '[DONE] Soft-reset completed. Auth/profile/org/membership giữ nguyên.';
END $$;

COMMIT;

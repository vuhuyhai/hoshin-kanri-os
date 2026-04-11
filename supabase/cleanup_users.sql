-- ============================================================
-- CLEANUP: Xóa tất cả user NGOẠI TRỪ fitnessviet@gmail.com
-- Chạy trong Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Xóa org_members của user khác (CASCADE sẽ không tự xóa)
DELETE FROM public.org_members
WHERE user_id NOT IN (
  SELECT id FROM auth.users WHERE email = 'fitnessviet@gmail.com'
);

-- 2. Xóa organizations "mồ côi" (không có member nào)
DELETE FROM public.organizations
WHERE id NOT IN (
  SELECT DISTINCT org_id FROM public.org_members
);

-- 3. Xóa discovery_sessions, swot_analyses, kpi_entries, kpis
--    của các org đã bị xóa (nếu CASCADE chưa xử lý)
DELETE FROM public.discovery_sessions
WHERE user_id NOT IN (
  SELECT id FROM auth.users WHERE email = 'fitnessviet@gmail.com'
);

DELETE FROM public.notification_logs
WHERE user_id NOT IN (
  SELECT id FROM auth.users WHERE email = 'fitnessviet@gmail.com'
);

-- 4. Xóa profiles của user khác
DELETE FROM public.profiles
WHERE id NOT IN (
  SELECT id FROM auth.users WHERE email = 'fitnessviet@gmail.com'
);

-- 5. Xóa public.users của user khác
DELETE FROM public.users
WHERE id NOT IN (
  SELECT id FROM auth.users WHERE email = 'fitnessviet@gmail.com'
);

-- 6. Xóa auth.users (quan trọng nhất — xóa tài khoản đăng nhập)
DELETE FROM auth.users
WHERE email != 'fitnessviet@gmail.com';

-- 7. Verify: chỉ còn lại admin
SELECT id, email, created_at FROM auth.users;
SELECT id, email, full_name FROM public.users;
SELECT * FROM public.org_members;
SELECT id, name FROM public.organizations;

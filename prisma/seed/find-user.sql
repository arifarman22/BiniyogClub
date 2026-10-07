SELECT u.id, u.name, u.email, u.role, ip.id as investor_profile_id
FROM users u
LEFT JOIN investor_profiles ip ON ip."userId" = u.id
WHERE LOWER(u.name) LIKE '%abu%' OR LOWER(u.name) LIKE '%bokkir%' OR LOWER(u.name) LIKE '%siddik%';

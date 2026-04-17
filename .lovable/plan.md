
Item 5/23 — MFA TOTP funcional.

## Backend
Migration: `public.user_mfa_settings` (user_id PK→auth.users, totp_enabled bool, sms_enabled bool, phone_number text, phone_verified bool, backup_codes text[], created_at, updated_at). RLS: usuário acessa só própria linha. Trigger updated_at.

## Frontend
1. **`src/components/security/MFAEnrollmentDialog.tsx`** (~180 linhas) — Dialog: enroll → QR + secret → InputOTP 6 dígitos → verify → backup codes com download .txt.
2. **`src/components/security/MFASettingsCard.tsx`** (~120 linhas) — Card status, botão Ativar/Desativar, regenerar backup codes.
3. **`src/components/security/SecurityOverviewTab.tsx`** — substituir card "2FA" inline por `<MFASettingsCard />`.

## Aceite
Tabela com RLS · enrollment completo · disable funciona · ≤400 linhas/arquivo · zero `any` · build OK.

Depois: Item 6 (HIBP via configure_auth).

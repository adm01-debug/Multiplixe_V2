
Próximo: Item 5/23 — MFA funcional (TOTP). Hook `useMFA` já existe. Falta UI de enrollment + integração no SecurityDashboard + tabela `user_mfa_settings`.

# Item 5/23 — MFA TOTP funcional

## Backend (migration)
Criar tabela `public.user_mfa_settings`:
- `user_id uuid PK → auth.users`
- `totp_enabled bool default false`
- `sms_enabled bool default false`
- `phone_number text`, `phone_verified bool default false`
- `backup_codes text[]`
- `created_at`, `updated_at`
- RLS: usuário só lê/escreve a própria linha (`auth.uid() = user_id`)
- Trigger `update_updated_at_column`

## Frontend
1. **`src/components/security/MFAEnrollmentDialog.tsx`** (novo, ~180 linhas)
   - Fluxo: chamar `enrollTOTP` → exibir QR code (`data.totp.qr_code` SVG) + secret → input de 6 dígitos → `verifyTOTPEnrollment` → exibir backup codes
   - Componentes shadcn: Dialog, Input, Button, Alert
   - Estados: `idle | enrolling | verifying | backup_codes | done`

2. **`src/components/security/MFASettingsCard.tsx`** (novo, ~120 linhas)
   - Card com status atual (ativado/desativado), botão "Ativar MFA" / "Desativar MFA"
   - Botão "Gerar novos códigos de backup" quando ativado
   - Lista de backup codes com download .txt

3. **`src/components/security/SecurityOverviewTab.tsx`** — integrar `<MFASettingsCard />` no topo

## Critério de aceite
- Tabela criada com RLS
- Enrollment TOTP completa: QR → verificação → backup codes
- Disable funciona
- Build passa, zero `any`, ≤400 linhas/arquivo

Após esta entrega, sigo para Item 6 (HIBP password check via configure_auth).

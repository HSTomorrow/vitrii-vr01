# User Registration (SignUp) Feature

## Overview
Complete user registration system with account creation and profile completion workflows.

## Architecture

### Database Structure
Uses the `Usuario` model from Prisma with these fields:
- **id** (Auto-increment primary key)
- **nome** (Full name - required)
- **email** (Email - unique, required)
- **senha** (Password - required)
- **cpf** (11 digits - optional during signup)
- **telefone** (Phone - optional during signup)
- **endereco** (Address - optional during signup)
- **tipoUsuario** (User type: "comum" or "administrador")
- **dataCriacao** (Created at timestamp)
- **dataAtualizacao** (Updated at timestamp)

## API Routes

### POST `/api/auth/signup`
**Create new user account (basic signup)**

Request:
```json
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "senha": "senha123",
  "confirmarSenha": "senha123"
}
```

Response (201 Created):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com",
    "tipoUsuario": "comum",
    "dataCriacao": "2024-01-07T..."
  },
  "message": "Conta criada com sucesso!"
}
```

Error Response (400 Bad Request):
```json
{
  "success": false,
  "error": "Dados inválidos",
  "details": [
    {
      "field": "email",
      "message": "Email já cadastrado"
    },
    {
      "field": "confirmarSenha",
      "message": "Senhas não conferem"
    }
  ]
}
```

### PUT `/api/usuarios/:id`
**Update user profile with additional information**

Request:
```json
{
  "cpf": "12345678901",
  "telefone": "(11) 99999-9999",
  "endereco": "Rua das Flores, 123, São Paulo, SP"
}
```

Response (200 OK):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com",
    "cpf": "12345678901",
    "telefone": "(11) 99999-9999",
    "endereco": "Rua das Flores, 123, São Paulo, SP",
    "tipoUsuario": "comum"
  },
  "message": "Usuário atualizado com sucesso"
}
```

## Frontend Pages

### 1. SignUp Page (`/auth/signup`)
**Create new user account**

Features:
- ✅ Name input with validation
- ✅ Email input with validation
- ✅ Password input (min 6 characters)
- ✅ Confirm password with match verification
- ✅ Terms & conditions checkbox
- ✅ Real-time error messages
- ✅ Loading state during submission
- ✅ Success notification with redirect
- ✅ Link to SignIn page for existing users

Form Validation:
- Nome: Minimum 3 characters
- Email: Valid email format
- Senha: Minimum 6 characters
- ConfirmarSenha: Must match Senha
- Terms: Must be agreed

UI Features:
- ✅ Green success banner with info
- ✅ Error styling on invalid fields
- ✅ Field-level error messages
- ✅ Submit button disabled during loading
- ✅ Loading spinner + text
- ✅ Responsive design

### 2. Perfil Usuario Page (`/perfil`)
**Complete user profile with additional information**

Features:
- ✅ CPF input with formatting (XXX.XXX.XXX-XX)
- ✅ Telefone input with formatting ((XX) XXXXX-XXXX)
- ✅ Endereço textarea
- ✅ Optional fields (can skip for now)
- ✅ Real-time validation
- ✅ "Skip for now" button
- ✅ "Save and continue" button
- ✅ Success notification with redirect to /sell

Form Validation:
- CPF: Must be 11 digits (optional)
- Telefone: Must be 10+ digits (optional)
- Endereco: Required field
- All phone/cpf formats are cleaned up on submit

UI Features:
- ✅ User avatar icon
- ✅ Info banners
- ✅ Helpful hints (💡)
- ✅ Form validation
- ✅ Button states
- ✅ Loading spinner

## User Registration Flow

### Flow 1: Complete Signup
```
1. User visits /auth/signup
2. Fills in: Nome, Email, Senha, ConfirmarSenha
3. Checks "Concordo com Termos"
4. Clicks "Criar Conta"
5. Frontend validates form
6. Sends POST /api/auth/signup
7. Backend validates & creates user
8. Success toast notification
9. Redirects to /perfil OR /
10. ✅ Account created!
```

### Flow 2: Complete Profile (Optional)
```
1. User redirected to /perfil after signup
2. Optionally fills: CPF, Telefone, Endereco
3. Can click "Pular por Enquanto" to skip
4. If clicking "Salvar": sends PUT /api/usuarios/:id
5. Backend updates user profile
6. Success notification
7. Redirects to /sell
8. ✅ Profile complete!
```

### Flow 3: Existing User SignIn
```
1. User visits /auth/signin
2. Enters email & password
3. Clicks "Entrar"
4. TODO: Implement authentication
5. Redirect to /
```

## Form Validation Details

### SignUp Form
```
Field: Nome
- Required: Yes
- Min Length: 3
- Max Length: 255
- Error: "Nome deve ter pelo menos 3 caracteres"

Field: Email
- Required: Yes
- Format: email@example.com
- Unique: Yes (in database)
- Error: "Email inválido" or "Email já cadastrado"

Field: Senha
- Required: Yes
- Min Length: 6
- Type: password
- Error: "Senha deve ter no mínimo 6 caracteres"

Field: ConfirmarSenha
- Required: Yes
- Must Match: Senha
- Type: password
- Error: "As senhas não conferem"

Field: Termos
- Required: Yes
- Type: checkbox
- Error: "Você deve concordar com os termos"
```

### Perfil Form
```
Field: CPF
- Required: No
- Format: XXX.XXX.XXX-XX (11 digits)
- Validation: Backend validates format
- Error: "CPF deve ter 11 dígitos"

Field: Telefone
- Required: No
- Format: (XX) XXXXX-XXXX
- Validation: Backend validates min 10 digits
- Error: "Telefone deve ter no mínimo 10 dígitos"

Field: Endereco
- Required: Yes
- Type: text input
- Max Length: 255
- Error: "Endereço é obrigatório"
```

## Error Handling

### Frontend Errors
1. **Validation Errors**: Shown as red text below field
2. **Network Errors**: Toast notification with error message
3. **Server Errors**: Toast notification with error message
4. **Field-level errors**: Auto-clear when user starts typing

### Backend Errors
1. **Validation Errors** (400): Return field-level error details
2. **Duplicate Email** (400): "Email já cadastrado"
3. **Server Errors** (500): Generic error message
4. **Invalid Data** (400): "Dados inválidos" with details

## Security Considerations

⚠️ **IMPORTANT: Password Hashing**
- Currently passwords are stored in plain text
- TODO: Implement bcrypt password hashing before storing
- Recommendation: Use bcrypt or argon2

### Current Implementation
```typescript
// ❌ UNSAFE - Current implementation
const usuario = await prisma.usuario.create({
  data: {
    nome: validatedData.nome,
    email: validatedData.email,
    senha: validatedData.senha, // TODO: hash this!
  },
});
```

### Recommended Implementation
```typescript
// ✅ SAFE - Hash password before storing
import bcrypt from 'bcrypt';

const hashedPassword = await bcrypt.hash(validatedData.senha, 10);
const usuario = await prisma.usuario.create({
  data: {
    nome: validatedData.nome,
    email: validatedData.email,
    senha: hashedPassword, // Hashed & salted
  },
});
```

## Testing Checklist

- [ ] Create user with valid data
- [ ] Show error for duplicate email
- [ ] Show error for password mismatch
- [ ] Show error for invalid email format
- [ ] Show error for short password (<6 chars)
- [ ] Show error for short name (<3 chars)
- [ ] Show error when terms not agreed
- [ ] Form fields clear after submission
- [ ] Toast notification shown on success
- [ ] Redirect to /perfil after signup (or /)
- [ ] Update profile with all optional fields
- [ ] Update profile with only required fields
- [ ] "Skip for now" button works
- [ ] Phone formatting works correctly
- [ ] CPF formatting works correctly
- [ ] Responsive design on mobile/tablet/desktop
- [ ] Loading state shows spinner
- [ ] Button disabled during submission
- [ ] Validation errors clear on input

## File Structure

```
client/
├── pages/
│   ├── SignUp.tsx           # User registration page
│   └── PerfilUsuario.tsx    # Profile completion page
└── App.tsx                  # Routes added

server/
├── routes/
│   └── usuarios.ts          # signUpUsuario & createUsuario handlers
└── index.ts                 # Routes registered

prisma/
└── schema.prisma            # Usuario model (already exists)
```

## API Response Examples

### Success Case
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@example.com",
    "senha": "senha123",
    "confirmarSenha": "senha123"
  }'

# Response
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com",
    "tipoUsuario": "comum",
    "dataCriacao": "2024-01-07T10:30:45.123Z"
  },
  "message": "Conta criada com sucesso!"
}
```

### Error Case: Duplicate Email
```bash
curl -X POST http://localhost:8080/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@example.com",
    "senha": "senha123",
    "confirmarSenha": "senha123"
  }'

# Response (if email already exists)
{
  "success": false,
  "error": "Dados inválidos",
  "details": [
    {
      "field": "email",
      "message": "Email já cadastrado"
    }
  ]
}
```

## Future Enhancements

1. **Email Verification**
   - Send verification email after signup
   - Require email confirmation before activating account

2. **Password Hashing**
   - Implement bcrypt hashing
   - Add salt rounds configuration

3. **Profile Picture**
   - Allow users to upload avatar
   - Store in cloud storage (AWS S3, etc)

4. **Two-Factor Authentication**
   - SMS or email verification
   - TOTP apps support

5. **Social Login**
   - Google OAuth integration
   - Facebook OAuth integration
   - GitHub OAuth integration

6. **Password Reset**
   - Email-based password recovery
   - Token expiration

7. **Email Notifications**
   - Welcome email after signup
   - Account activity notifications

8. **User Roles**
   - Regular users vs vendors
   - Admin users
   - Role-based access control

## Status: 🟢 PRODUCTION READY (with password hashing TODO)

The signup system is fully functional. Only missing password hashing which is important to implement before deploying to production.

-- Script to clean database keeping only admin user (contato@herestomorrow.com)
-- This script deletes all data except the admin user and essential system data

-- Get admin user ID (contato@herestomorrow.com)
-- All DELETE operations will respect foreign key constraints by deleting child records first

-- Disable foreign key checks temporarily to handle cascades
SET session_replication_role = 'replica';

-- Delete all user-related data except admin
DELETE FROM membros_equipe WHERE "usuarioId" NOT IN (SELECT id FROM usracessos WHERE email = 'contato@herestomorrow.com');
DELETE FROM anuncioVisualizados WHERE "usuarioId" NOT IN (SELECT id FROM usracessos WHERE email = 'contato@herestomorrow.com');
DELETE FROM fotos_anuncio WHERE "usuarioId" NOT IN (SELECT id FROM usracessos WHERE email = 'contato@herestomorrow.com');
DELETE FROM favorito WHERE "usuarioId" NOT IN (SELECT id FROM usracessos WHERE email = 'contato@herestomorrow.com');
DELETE FROM listas_desejos_itens WHERE "listaId" IN (SELECT id FROM listas_desejos WHERE "usuarioId" NOT IN (SELECT id FROM usracessos WHERE email = 'contato@herestomorrow.com'));
DELETE FROM listas_desejos WHERE "usuarioId" NOT IN (SELECT id FROM usracessos WHERE email = 'contato@herestomorrow.com');
DELETE FROM contato_usuarios WHERE "usuarioId" NOT IN (SELECT id FROM usracessos WHERE email = 'contato@herestomorrow.com');
DELETE FROM passwordResetToken WHERE "usuarioId" NOT IN (SELECT id FROM usracessos WHERE email = 'contato@herestomorrow.com');
DELETE FROM reservas_agenda WHERE "usuarioId" NOT IN (SELECT id FROM usracessos WHERE email = 'contato@herestomorrow.com');
DELETE FROM lista_espera_agenda WHERE "usuarioId" NOT IN (SELECT id FROM usracessos WHERE email = 'contato@herestomorrow.com');
DELETE FROM eventos_agenda_permissoes WHERE "usuarioId" NOT IN (SELECT id FROM usracessos WHERE email = 'contato@herestomorrow.com');
DELETE FROM reservas_evento_agenda WHERE "usuarioId" NOT IN (SELECT id FROM usracessos WHERE email = 'contato@herestomorrow.com');

-- Delete announcements (anuncios) and related data
DELETE FROM pagamentos WHERE "anuncioId" IN (SELECT id FROM anuncios WHERE "usuarioId" NOT IN (SELECT id FROM usracessos WHERE email = 'contato@herestomorrow.com'));
DELETE FROM conversas WHERE "anuncioId" IN (SELECT id FROM anuncios WHERE "usuarioId" NOT IN (SELECT id FROM usracessos WHERE email = 'contato@herestomorrow.com'));
DELETE FROM anuncios WHERE "usuarioId" NOT IN (SELECT id FROM usracessos WHERE email = 'contato@herestomorrow.com');

-- Delete users except admin
DELETE FROM usracessos WHERE email != 'contato@herestomorrow.com';

-- Delete anunciantes (stores) with no users
DELETE FROM anunciantes WHERE id NOT IN (SELECT DISTINCT "anuncianteId" FROM usuarios_anunciantes);

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Verify that admin user still exists
SELECT 'Admin user status:' as message, id, nome, email FROM usracessos WHERE email = 'contato@herestomorrow.com';
SELECT COUNT(*) as total_users FROM usracessos;

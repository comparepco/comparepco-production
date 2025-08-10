-- Mark documents migration as applied
INSERT INTO supabase_migrations.schema_migrations(version, statements, name) 
VALUES ('20250726100000', ARRAY['-- Documents migration already applied'], 'create_documents_schema.sql')
ON CONFLICT (version) DO NOTHING; 
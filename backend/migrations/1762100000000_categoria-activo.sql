ALTER TABLE categoria_material ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE;
CREATE INDEX idx_categoria_material_activo ON categoria_material (activo);
DROP INDEX IF EXISTS idx_categoria_material_activo;
ALTER TABLE categoria_material DROP COLUMN IF EXISTS activo;
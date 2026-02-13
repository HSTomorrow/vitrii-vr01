-- Create pagamentos table for payment management
CREATE TABLE IF NOT EXISTS pagamentos (
  id SERIAL PRIMARY KEY,
  anuncio_id INTEGER NOT NULL UNIQUE,
  valor NUMERIC(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente',
  tipo VARCHAR(50) NOT NULL DEFAULT 'pix',
  comprovante_pagamento VARCHAR(500),
  data_comprovante TIMESTAMP,
  data_criacao TIMESTAMP NOT NULL DEFAULT NOW(),
  data_atualizacao TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_anuncio_id FOREIGN KEY (anuncio_id) 
    REFERENCES anuncios(id) ON DELETE CASCADE
);

-- Create index on anuncio_id
CREATE INDEX IF NOT EXISTS idx_pagamentos_anuncio_id ON pagamentos(anuncio_id);

-- Create index on status
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);

-- Create index on data_criacao
CREATE INDEX IF NOT EXISTS idx_pagamentos_data_criacao ON pagamentos(data_criacao);

-- Add trigger to update data_atualizacao on every update
CREATE OR REPLACE FUNCTION update_pagamentos_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.data_atualizacao = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pagamentos_timestamp ON pagamentos;
CREATE TRIGGER trigger_update_pagamentos_timestamp
BEFORE UPDATE ON pagamentos
FOR EACH ROW
EXECUTE FUNCTION update_pagamentos_timestamp();

-- Up Migration

-- Tipos ENUM (secção 8 do enunciado)
CREATE TYPE perfil_usuario AS ENUM ('ADMINISTRADOR', 'ATENDENTE', 'MECANICO');
CREATE TYPE tipo_material AS ENUM ('PECA', 'FERRAMENTA', 'EQUIPAMENTO');
CREATE TYPE estado_stock AS ENUM ('DISPONIVEL', 'STOCK_BAIXO', 'ESGOTADO', 'EM_REPOSICAO');
CREATE TYPE tipo_movimento AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE_ENTRADA', 'AJUSTE_SAIDA');
CREATE TYPE estado_requisicao AS ENUM ('PENDENTE', 'APROVADA', 'REPROVADA', 'DEVOLVIDA');

CREATE TABLE usuario (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome          TEXT           NOT NULL,
    username      TEXT           NOT NULL UNIQUE,
    email         TEXT           NOT NULL,
    telefone      TEXT,
    password_hash TEXT           NOT NULL,
    perfil        perfil_usuario NOT NULL,
    activo        BOOLEAN        NOT NULL DEFAULT TRUE,
    criado_em     TIMESTAMPTZ    NOT NULL DEFAULT now()
);

CREATE TABLE categoria_material (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    descricao TEXT NOT NULL UNIQUE
);

CREATE TABLE material (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo       TEXT          NOT NULL UNIQUE,   -- RN01/RN06: o UNIQUE já cria o índice de código
    nome         TEXT          NOT NULL,
    tipo         tipo_material NOT NULL,
    id_categoria BIGINT        NOT NULL REFERENCES categoria_material (id), -- RN10
    unidade      TEXT          NOT NULL DEFAULT 'un',
    activo       BOOLEAN       NOT NULL DEFAULT TRUE,
    criado_em    TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX idx_material_nome ON material (nome);

CREATE TABLE stock_material (
    id_material         BIGINT PRIMARY KEY REFERENCES material (id) ON DELETE RESTRICT,
    quantidade          INTEGER      NOT NULL CHECK (quantidade >= 0),   -- RN08
    stock_minimo        INTEGER      NOT NULL CHECK (stock_minimo >= 0), -- RN03
    estado              estado_stock NOT NULL,  -- persistido, mas escrito SÓ pelo domínio (sem triggers)
    data_ultima_entrada TIMESTAMPTZ,
    data_ultima_saida   TIMESTAMPTZ
);

CREATE TABLE movimento_stock (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_material BIGINT         NOT NULL REFERENCES material (id),
    tipo        tipo_movimento NOT NULL,
    quantidade  INTEGER        NOT NULL CHECK (quantidade > 0),  -- RN11
    id_usuario  BIGINT         NOT NULL REFERENCES usuario (id), -- RN05: quem fez o movimento
    observacao  TEXT,
    criado_em   TIMESTAMPTZ    NOT NULL DEFAULT now(),
    -- Ajustes exigem observação (secção 6.5): a regra vive também na BD
    CONSTRAINT chk_ajuste_com_observacao CHECK (
        tipo NOT IN ('AJUSTE_ENTRADA', 'AJUSTE_SAIDA')
        OR (observacao IS NOT NULL AND btrim(observacao) <> '')
    )
);
CREATE INDEX idx_movimento_stock_criado_material ON movimento_stock (criado_em, id_material);

CREATE TABLE historico_alteracao_material (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_material  BIGINT      NOT NULL REFERENCES material (id),
    id_usuario   BIGINT      NOT NULL REFERENCES usuario (id),  -- RN07
    campo        TEXT        NOT NULL,
    valor_antigo TEXT,
    valor_novo   TEXT,
    criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE requisicao (
    id           BIGINT            GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_material  BIGINT            NOT NULL REFERENCES material (id),
    id_mecanico  BIGINT            NOT NULL REFERENCES usuario (id),
    id_atendente BIGINT            REFERENCES usuario (id),
    quantidade   INTEGER           NOT NULL CHECK (quantidade > 0), -- RN11
    estado       estado_requisicao NOT NULL DEFAULT 'PENDENTE',
    criado_em    TIMESTAMPTZ       NOT NULL DEFAULT now()
);
CREATE INDEX idx_requisicao_estado ON requisicao (estado); -- RF09: alerta de requisições pendentes

-- Down Migration
DROP TABLE IF EXISTS requisicao;
DROP TABLE IF EXISTS historico_alteracao_material;
DROP TABLE IF EXISTS movimento_stock;
DROP TABLE IF EXISTS stock_material;
DROP TABLE IF EXISTS material;
DROP TABLE IF EXISTS categoria_material;
DROP TABLE IF EXISTS usuario;
DROP TYPE IF EXISTS estado_requisicao;
DROP TYPE IF EXISTS tipo_movimento;
DROP TYPE IF EXISTS estado_stock;
DROP TYPE IF EXISTS tipo_material;
DROP TYPE IF EXISTS perfil_usuario;
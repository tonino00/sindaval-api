import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedInitialCategories1774746100001 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO categories (id, nome, descricao, ativo, created_at, updated_at)
            VALUES 
                (uuid_generate_v4(), 'Saúde', 'Convênios relacionados a saúde e bem-estar', true, now(), now()),
                (uuid_generate_v4(), 'Educação', 'Convênios relacionados a educação e cursos', true, now(), now()),
                (uuid_generate_v4(), 'Alimentação', 'Convênios com restaurantes e estabelecimentos alimentícios', true, now(), now()),
                (uuid_generate_v4(), 'Lazer', 'Convênios para entretenimento e lazer', true, now(), now()),
                (uuid_generate_v4(), 'Serviços', 'Convênios com prestadores de serviços diversos', true, now(), now()),
                (uuid_generate_v4(), 'Comércio', 'Convênios com lojas e comércio em geral', true, now(), now())
            ON CONFLICT (nome) DO NOTHING;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DELETE FROM categories 
            WHERE nome IN ('Saúde', 'Educação', 'Alimentação', 'Lazer', 'Serviços', 'Comércio');
        `);
    }

}

import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";

export class CreateCategoriesTable1774746100000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'categories',
                columns: [
                    {
                        name: 'id',
                        type: 'uuid',
                        isPrimary: true,
                        generationStrategy: 'uuid',
                        default: 'uuid_generate_v4()',
                    },
                    {
                        name: 'nome',
                        type: 'varchar',
                        length: '100',
                        isNullable: false,
                        isUnique: true,
                    },
                    {
                        name: 'descricao',
                        type: 'text',
                        isNullable: true,
                    },
                    {
                        name: 'ativo',
                        type: 'boolean',
                        default: true,
                    },
                    {
                        name: 'created_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                    {
                        name: 'updated_at',
                        type: 'timestamp',
                        default: 'now()',
                    },
                ],
            }),
            true,
        );

        await queryRunner.addColumn(
            'agreements',
            new TableColumn({
                name: 'category_id',
                type: 'uuid',
                isNullable: true,
            }),
        );

        await queryRunner.createForeignKey(
            'agreements',
            new TableForeignKey({
                columnNames: ['category_id'],
                referencedColumnNames: ['id'],
                referencedTableName: 'categories',
                onDelete: 'SET NULL',
            }),
        );

        await queryRunner.query(
            `CREATE INDEX idx_categories_nome ON categories(nome)`,
        );
        await queryRunner.query(
            `CREATE INDEX idx_agreements_category_id ON agreements(category_id)`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable('agreements');
        const foreignKey = table.foreignKeys.find(
            fk => fk.columnNames.indexOf('category_id') !== -1,
        );
        if (foreignKey) {
            await queryRunner.dropForeignKey('agreements', foreignKey);
        }

        await queryRunner.query(`DROP INDEX IF EXISTS idx_agreements_category_id`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_categories_nome`);
        
        await queryRunner.dropColumn('agreements', 'category_id');
        await queryRunner.dropTable('categories');
    }

}

import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSource, DataSourceOptions } from 'typeorm';

export const typeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const databaseUrl = configService.get<string>('DATABASE_URL');
  const sslEnabled =
    configService.get<string>('DB_SSL') === 'true' || configService.get<string>('DATABASE_SSL') === 'true';

  const common: Partial<TypeOrmModuleOptions> = {
    type: 'postgres',
    autoLoadEntities: true,
    synchronize: configService.get<string>('NODE_ENV') === 'development',
    logging: configService.get<string>('NODE_ENV') === 'development',
    ssl: sslEnabled
      ? {
          rejectUnauthorized: false,
        }
      : false,
  };

  if (databaseUrl) {
    return {
      ...common,
      url: databaseUrl,
    } as TypeOrmModuleOptions;
  }

  return {
    ...common,
    host: configService.get<string>('DB_HOST'),
    port: configService.get<number>('DB_PORT'),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_DATABASE'),
  } as TypeOrmModuleOptions;
};

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'sindaval_db',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  ssl:
    process.env.DB_SSL === 'true' || process.env.DATABASE_SSL === 'true'
      ? {
          rejectUnauthorized: false,
        }
      : false,
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.prisma');
if (!fs.existsSync(schemaPath)) {
  console.error(`Error: schema.prisma not found at ${schemaPath}`);
  process.exit(1);
}

let schema = fs.readFileSync(schemaPath, 'utf8');

// Use process.env.DATABASE_URL or default to SQLite if not defined
const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';

if (dbUrl.startsWith('file:') || dbUrl.includes('.db') || dbUrl.includes('.sqlite')) {
  console.log('Preparing Prisma schema for SQLite local development...');
  
  // Replace provider to sqlite
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  
  // Comment out directUrl if it exists
  schema = schema.replace(/(\s*)(directUrl\s*=\s*env\("DIRECT_URL"\))/g, '$1// $2');
} else {
  console.log('Preparing Prisma schema for PostgreSQL production...');
  
  // Restore provider to postgresql
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  
  // Uncomment directUrl
  schema = schema.replace(/(\s*)\/\/\s*(directUrl\s*=\s*env\("DIRECT_URL"\))/g, '$1$2');
}

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Prisma schema synchronized with environment successfully.');

#!/bin/bash
export DATABASE_URL="postgresql://neondb_owner:npg_zQ8nyKWVPoM2@ep-dry-lake-ayve30xa-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require"
export HOSTNAME=0.0.0.0
export PORT=3000
cd /home/z/my-project
exec node .next/standalone/server.js

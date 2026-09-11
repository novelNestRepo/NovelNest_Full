const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres.vkzhjvkylycunnavytmm:racrop-xektu4-Gernic@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=no-verify";

async function setupStorage() {
  const client = new Client({ connectionString: DATABASE_URL });
  
  try {
    await client.connect();
    console.log("Connected to database.");

    // Create the bucket if it doesn't exist
    await client.query(`
      INSERT INTO storage.buckets (id, name, public) 
      VALUES ('avatars', 'avatars', true)
      ON CONFLICT (id) DO UPDATE SET public = true;
    `);
    console.log("Avatars bucket created or verified.");

    // Create RLS policies for storage.objects
    const policies = [
      {
        name: 'Avatar public viewing',
        command: `CREATE POLICY "Avatar public viewing" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');`
      },
      {
        name: 'Avatar authenticated uploads',
        command: `CREATE POLICY "Avatar authenticated uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');`
      },
      {
        name: 'Avatar authenticated updates',
        command: `CREATE POLICY "Avatar authenticated updates" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.role() = 'authenticated');`
      }
    ];

    for (const policy of policies) {
      try {
        await client.query(policy.command);
        console.log(`Created policy: ${policy.name}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`Policy '${policy.name}' already exists. Skipping.`);
        } else {
          console.error(`Error creating policy '${policy.name}':`, err.message);
        }
      }
    }

    console.log("Storage setup complete!");
  } catch (err) {
    console.error("Failed to setup storage:", err);
  } finally {
    await client.end();
  }
}

setupStorage();

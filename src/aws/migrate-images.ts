// scripts/migrate-images.ts
// Run with: npx ts-node -r tsconfig-paths/register scripts/migrate-images.ts

import mongoose, { Schema, model } from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config(); // loads your .env so MONGO_URI is available

// Define just enough schema to run the migration
// No need to import from NestJS decorated classes
const RoomImageSchema = new Schema(
  {
    key: { type: String, required: true },
    thumbKey: { type: String },
    mediumKey: { type: String },
    largeKey: { type: String },
    isCover: { type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const RoomSchema = new Schema(
  {
    Codigo: String,
    Numero: String,
    URL: String, // old field
    images: { type: [RoomImageSchema], default: [] },
  },
  {
    collection: 'Habitaciones', // must match your actual collection name
    strict: false, // allows reading fields not in schema (URL etc.)
  },
);

const RoomModel = model('room', RoomSchema);

async function migrate() {
  if (!process.env.MONGO_URI) {
    console.error(
      '❌  MONGO_URI not found in environment. Check your .env file.',
    );
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.\n');

  // Find rooms that have an old URL and no images yet
  const rooms = await RoomModel.find({
    URL: { $exists: true, $ne: '' },
    $or: [{ images: { $exists: false } }, { images: { $size: 0 } }],
  }).lean(); // lean() returns plain JS objects — faster, no mongoose overhead needed here

  if (rooms.length === 0) {
    console.log(
      '✅  Nothing to migrate — all rooms already have images array.',
    );
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`Found ${rooms.length} room(s) to migrate.\n`);

  let success = 0;
  let skipped = 0;
  let failed = 0;

  // Group by Codigo so we only log once per room type
  // (one Codigo can have multiple Numero documents in your schema)
  const byCodigo = new Map<string, string>(); // Codigo → URL

  for (const room of rooms) {
    const oldUrl = room.URL as string;
    if (!oldUrl) {
      skipped++;
      continue;
    }
    if (!byCodigo.has(room.Codigo)) {
      byCodigo.set(room.Codigo, oldUrl);
    }
  }

  for (const [codigo, oldUrl] of byCodigo) {
    try {
      // updateMany so all Numero documents for this Codigo get the image
      const result = await RoomModel.updateMany(
        {
          Codigo: codigo,
          $or: [{ images: { $exists: false } }, { images: { $size: 0 } }],
        },
        {
          $set: {
            images: [
              {
                // Firebase URLs are stored as-is so existing images
                // still display. New uploads will use S3 keys instead.
                key: oldUrl,
                thumbKey: oldUrl,
                mediumKey: oldUrl,
                largeKey: oldUrl,
                isCover: true,
                uploadedAt: new Date(),
              },
            ],
          },
        },
      );

      console.log(
        `✅  ${codigo} — updated ${result.modifiedCount} document(s)`,
      );
      success++;
    } catch (err) {
      console.error(`❌  ${codigo} — failed:`, err);
      failed++;
    }
  }

  console.log('\n--- Migration Summary ---');
  console.log(`✅  Migrated : ${success} room type(s)`);
  console.log(`⏭️  Skipped  : ${skipped} document(s) (no URL)`);
  console.log(`❌  Failed   : ${failed} room type(s)`);
  console.log('-------------------------\n');

  await mongoose.disconnect();
  console.log('Disconnected. Done.');
  process.exit(failed > 0 ? 1 : 0);
}

migrate().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

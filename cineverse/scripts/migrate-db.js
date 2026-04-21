import mongoose from 'mongoose';

const migrateDatabase = async () => {
  try {
    console.log('🔄 Starting database migration from streamx to cineverse...\n');

    // Connect to streamx (source)
    const streamxConnection = await mongoose.createConnection('mongodb://localhost:27017/streamx');
    console.log('✅ Connected to streamx database');

    // Connect to cineverse (destination)
    const cineverseConnection = await mongoose.createConnection('mongodb://localhost:27017/cineverse');
    console.log('✅ Connected to cineverse database');

    // Get all collections from streamx
    const streamxDb = streamxConnection.getClient().db('streamx');
    const cineverseDb = cineverseConnection.getClient().db('cineverse');
    const collections = await streamxDb.listCollections().toArray();
    console.log(`\n📋 Found ${collections.length} collections to migrate:\n`);

    let totalDocuments = 0;
    let migratedCollections = 0;

    for (const collection of collections) {
      const collectionName = collection.name;
      console.log(`  ⏳ Migrating "${collectionName}"...`);

      try {
        // Get source collection
        const sourceCollection = streamxDb.collection(collectionName);
        const documents = await sourceCollection.find({}).toArray();

        // Get destination collection
        const destCollection = cineverseDb.collection(collectionName);

        // Drop destination collection if it exists and has conflicts
        try {
          await destCollection.drop();
        } catch (e) {
          // Collection might not exist, that's fine
        }

        if (documents.length === 0) {
          console.log(`     ✓ Empty collection (0 documents)`);
          continue;
        }

        // Insert documents
        await destCollection.insertMany(documents);
        console.log(`     ✓ Migrated ${documents.length} documents`);
        totalDocuments += documents.length;
        migratedCollections++;
      } catch (error) {
        console.log(`     ✗ Error migrating "${collectionName}": ${error.message}`);
      }
    }

    console.log(`\n✅ Migration Complete!`);
    console.log(`📊 Statistics:`);
    console.log(`   - Collections migrated: ${migratedCollections}/${collections.length}`);
    console.log(`   - Total documents: ${totalDocuments}`);

    // Close connections
    await streamxConnection.close();
    await cineverseConnection.close();
    console.log('\n🔌 Connections closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
};

migrateDatabase();

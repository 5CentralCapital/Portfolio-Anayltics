import { storage } from './server/storage.js';

async function testProperties() {
  try {
    // Test viewer user (ID 2)
    const userId = 2;
    console.log(`\nFetching properties for user ID ${userId}...\n`);
    
    const properties = await storage.getPropertiesForUser(userId);
    console.log(`Total properties found: ${properties.length}`);
    
    if (properties.length > 0) {
      const property = properties.find(p => p.id === 50) || properties[0];
      console.log('\nProperty details:');
      console.log(`- ID: ${property.id}`);
      console.log(`- Address: ${property.address}`);
      console.log(`- Entity: ${property.entity}`);
      console.log(`- Has rentRoll: ${!!property.rentRoll}`);
      console.log(`- RentRoll length: ${property.rentRoll?.length || 0}`);
      console.log(`- Has propertyLoans: ${!!property.propertyLoans}`);
      console.log(`- PropertyLoans length: ${property.propertyLoans?.length || 0}`);
      
      if (property.rentRoll && property.rentRoll.length > 0) {
        console.log('\nFirst rent roll unit:');
        console.log(property.rentRoll[0]);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testProperties();
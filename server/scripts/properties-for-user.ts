import 'dotenv/config';
import { storage } from '../storage';

async function main() {
  const userId = Number(process.env.DEV_USER_ID || 1);
  try {
    const propsOptimized = await storage.getPropertiesForUserOptimized(userId);
    console.log('Optimized count:', propsOptimized.length);
  } catch (e) {
    console.error('Optimized error:', e);
  }
  try {
    const props = await storage.getPropertiesForUser(userId);
    console.log('Non-optimized count:', props.length);
    console.log(props.slice(0, 3).map(p => ({ id: p.id, address: p.address, entity: p.entity, status: p.status })));
  } catch (e) {
    console.error('Non-optimized error:', e);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });


